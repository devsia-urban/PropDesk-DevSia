import { createClient } from '@/lib/supabase/server';
import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export const maxDuration = 30;

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {

    const supabase = await createClient();

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { data: userData } = await supabase
      .from('profiles')
      .select('id, agency_id, full_name, role')
      .eq('id', user.id)
      .single();

    if (!userData?.agency_id) {
      return new Response(JSON.stringify({ error: 'No agency found' }), { status: 403 });
    }

    const AGENCY_ID = userData.agency_id;
    const AGENT_NAME = userData.full_name || 'there';
    const body = await req.json();

    let adminContactStr = "Contact the Developer: Hardik Jain. Call: 8271310911, WhatsApp (Business): 7208850778.";
    if (userData.role !== 'admin') {
      const { data: adminData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('agency_id', AGENCY_ID)
        .eq('role', 'admin')
        .limit(1)
        .single();
      if (adminData) {
        adminContactStr = `Contact your Admin: ${adminData.full_name} (Phone: ${adminData.phone || 'Not provided'}).`;
      }
    }

    // Normalize messages: SDK sends { role, content, id, parts? }
    // convertToModelMessages needs `parts` on each message.
    const rawMessages: any[] = Array.isArray(body.messages) ? body.messages : [];
    const normalizedMessages = rawMessages.map((msg: any) => ({
      ...msg,
      parts: msg.parts ?? (
        typeof msg.content === 'string'
          ? [{ type: 'text', text: msg.content }]
          : []
      ),
    }));

    const modelMessages = await convertToModelMessages(normalizedMessages);

    // ── System Prompt ────────────────────────────────────────────────────────
    const systemPrompt = `
You are DevSia Copilot, an advanced AI assistant for real estate agents.

Your primary goal is to help agents find properties, manage leads, view stats, AND add new records to the database.

CRITICAL INSTRUCTIONS FOR ADDING RECORDS:
1. DO NOT guess or hallucinate details when adding properties or leads.
2. If adding a CLIENT/LEAD, you MUST gather: Full Name, Phone (use '0000000000' if skipped), Looking For, Property Type, Location, Budget.
3. If adding a PROPERTY, you MUST gather: Property Type, Listing Type (sale/rent), Price, Locality, and City. (Ask for the city, never assume a default).
4. IF ANY CORE DETAIL IS MISSING (for either Client or Property): Ask the user for them nicely in ONE short sentence.
   - EXCEPTION: If the user says "keep it blank", respect it and use a placeholder.
   - NEVER repeat the details you already have back to the user. DO NOT use markdown lists or bold text.
5. BEFORE GENERATING THE DRAFT:
   - For CLIENTS: Ask ONCE gently, "Is there anything else you'd like to add?"
   - For PROPERTIES: You MUST ask for extra info relevant to the property type BEFORE calling the draft_property tool. 
      - If it's a **Plot/Land**: Ask about approval type (e.g., JDA approved), road size, dimensions, corner plot, facing direction. (NEVER ask about furnishing!)
      - If it's a **Flat/Villa/House/Penthouse**: Ask about BHK/bedrooms/bathrooms/balconies, approval authority (e.g., JDA/RERA), furnishing (semi/fully), facing direction, floor number, and parking.
      - If it's **Commercial**: You MUST ask if it is a commercial land, space, or shop.
      - **CRITICAL**: For ALL property types, if the Listing Type is **Rent or Lease**, you MUST ask for the Maintenance Charge (if any) before saving.
      - Keep these questions extremely concise and conversational. Gather missing info in 1 or 2 short questions maximum.
6. FOR PROPERTIES ONLY: Auto-generate a highly professional, SEO-friendly \`title\` and \`description\`.
   - The \`title\` MUST be extremely short (2 to 3 words maximum) and perfectly unique (e.g. "Premium 3BHK Vaishali" or "Commercial Patta Plot"). DO NOT write sentences.
7. BUDGETS & PRICES MUST BE FULL RAW NUMBERS! 40 Lacs = 4000000. 1.5 Cr = 15000000. NEVER use small decimals like 0.40 or 1.5.

Always format prices beautifully in chat responses (e.g., ₹50 L, ₹1.5 Cr). Keep responses friendly, EXTREMELY CONCISE, and strictly avoid unnecessary markdown formatting. The agent you are helping is named "${AGENT_NAME}".

## SUPPORT & HELP
ONLY if the user EXPLICITLY asks for help or support, provide this exact contact info:
${adminContactStr}
DO NOT provide this contact info for general inquiries or if you cannot find data.

## CRITICAL RULES — NEVER BREAK THESE:
1. You can ONLY read data. You CANNOT create, edit, update, or delete any records.
2. You MUST use your tools to answer any question about properties, clients/leads, bookings, or stats.
   Never say "I cannot filter by X" — you have tools for all of it. Use them.
3. Always use ALL relevant tool parameters available. If the user says "above 1 Cr", pass minBudgetCr=1.
   If they say "in Jagatpura", pass locality="Jagatpura". Never ignore filter hints in the user query.
4. If a query returns 0 results, say so gracefully and suggest adjusting the filter.
5. Format all prices in INR: use "Cr" for crores and "L" for lakhs. e.g. ₹1.5 Cr, ₹25L.
6. Be concise, warm, and professional. Address the agent by their first name occasionally.

## YOUR TOOLS:
- find_properties   → search, filter, sort available properties
- find_clients      → search and filter leads/clients (buyers, renters, sellers)
- find_smart_matches → find the best client matches for a specific property (or vice versa)
- get_agency_stats  → get pipeline summary, booking count, lead count, revenue etc.

## EXAMPLE QUERIES YOU CAN HANDLE:
- "Show me properties above 1 Cr in Jagatpura" → use find_properties with minBudgetCr=1, locality="Jagatpura"
- "Find 3BHK flats under 80L" → find_properties with maxBudgetCr=0.8, bhk=3, propertyType="flat"
- "Who are my active buyers?" → find_clients with status="active", lookingFor="buy"
- "Show me leads added this week" → find_clients with recentDays=7
- "Find matches for Kotak Villa" → find_smart_matches with propertyTitle="Kotak Villa"
- "How many bookings this month?" → get_agency_stats
`.trim();

    // ── Tools ────────────────────────────────────────────────────────────────
    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: modelMessages,
      system: systemPrompt,
      tools: {

        // ── 1. FIND PROPERTIES ──────────────────────────────────────────────
        find_properties: tool({
          description: `
            Search and filter the agency's property listings.
            Use this for ANY question about properties: by location, price, BHK, type, status, or availability.
            All parameters are optional — pass only what the user specifies.
          `,
          inputSchema: z.object({
            title:         z.string().optional().describe('Name or title of the property'),
            locality:      z.string().optional().describe('Area or locality name, e.g. Jagatpura, Mansarovar, Vaishali Nagar'),
            city:          z.string().optional().describe('City name, e.g. Jaipur, Delhi'),
            bhk:           z.number().optional().describe('Number of BHK, e.g. 2, 3, 4'),
            minBudgetCr:   z.number().optional().describe('Minimum price in Crores, e.g. 0.5 means 50L, 1.5 means 1.5 Cr'),
            maxBudgetCr:   z.number().optional().describe('Maximum price in Crores, e.g. 1 means 1 Cr'),
            propertyType:  z.string().optional().describe('Type: apartment, flat, floor, villa, independent_house, kothi, plot, commercial, farmhouse, penthouse'),
            status:        z.string().optional().describe('Status: available, hold, booked, sold, rented. Default to available if not specified.'),
            listingType:   z.string().optional().describe('sale, rent, or lease'),
            furnishing:    z.string().optional().describe('unfurnished, semi_furnished, fully_furnished'),
            limit:         z.number().optional().describe('Max results to return, default 5'),
          }),
          execute: async ({ title, locality, city, bhk, minBudgetCr, maxBudgetCr, propertyType, status, listingType, furnishing, limit }) => {
            console.log('[Tool: find_properties]', { title, locality, city, bhk, minBudgetCr, maxBudgetCr, propertyType, status, listingType, furnishing, limit });

            let query = supabase
              .from('properties')
              .select('id, title, bhk, locality, city, price, status, property_type, listing_type, furnishing, area_sqft, area_unit, cover_image_url, is_deleted')
              .eq('agency_id', AGENCY_ID)
              .eq('is_deleted', false)
              .order('created_at', { ascending: false })
              .limit(limit ?? 5);

            // Apply filters
            if (title)        query = query.ilike('title', `%${title}%`);
            if (locality)     query = query.ilike('locality', `%${locality}%`);
            if (city)         query = query.ilike('city', `%${city}%`);
            if (minBudgetCr)  query = query.gte('price', minBudgetCr * 10_000_000);
            if (maxBudgetCr)  query = query.lte('price', maxBudgetCr * 10_000_000);
            if (propertyType) query = query.ilike('property_type', `%${propertyType}%`);
            if (status)       query = query.ilike('status', `%${status}%`);
            if (listingType)  query = query.ilike('listing_type', `%${listingType}%`);
            if (furnishing)   query = query.ilike('furnishing', `%${furnishing}%`);

            const { data, error } = await query;

            if (error) {
              console.error('[Tool Error: find_properties]', error);
              return { error: 'Database query failed.', properties: [], count: 0 };
            }

            // BHK is an array column — filter in memory
            let results = data || [];
            if (bhk) {
              results = results.filter((p: any) =>
                Array.isArray(p.bhk) ? p.bhk.includes(bhk) : p.bhk === bhk
              );
            }

            // Enrich with formatted price
            const enriched = results.map((p: any) => ({
              ...p,
              price_formatted: fmtPrice(p.price),
              bhk_display: Array.isArray(p.bhk) ? p.bhk.join('/') + ' BHK' : `${p.bhk} BHK`,
            }));

            console.log(`[Tool: find_properties] Found ${enriched.length} results`);
            return { count: enriched.length, properties: enriched };
          },
        }),

        // ── 2. FIND CLIENTS / LEADS ─────────────────────────────────────────
        find_clients: tool({
          description: `
            Search and filter the agency's clients (leads/buyers/renters/sellers).
            Use this for ANY question about leads, buyers, clients, or customers.
          `,
          inputSchema: z.object({
            name:          z.string().optional().describe('Name of the client/lead'),
            lookingFor:    z.string().optional().describe('What they want: buy, rent, sell, lease'),
            status:        z.string().optional().describe('Client status: active, matched, closed'),
            locality:      z.string().optional().describe('Preferred location they are looking in'),
            minBudgetL:    z.number().optional().describe('Minimum budget in Lakhs'),
            maxBudgetL:    z.number().optional().describe('Maximum budget in Lakhs'),
            bhk:           z.number().optional().describe('BHK requirement'),
            priority:      z.string().optional().describe('Priority: low, medium, high'),
            source:        z.string().optional().describe('Source: walk_in, referral, social_media, property_portal, cold_call'),
            recentDays:    z.number().optional().describe('Only show clients added in the last N days'),
            limit:         z.number().optional().describe('Max results to return, default 6'),
          }),
          execute: async ({ name, lookingFor, status, locality, minBudgetL, maxBudgetL, bhk, priority, source, recentDays, limit }) => {
            console.log('[Tool: find_clients]', { name, lookingFor, status, locality, minBudgetL, maxBudgetL, bhk, priority, source, recentDays, limit });

            let query = supabase
              .from('clients')
              .select('id, full_name, phone, email, status, priority, looking_for, preferred_locations, preferred_bhks, budget_min, budget_max, source, follow_up_date, created_at, is_deleted')
              .eq('agency_id', AGENCY_ID)
              .eq('is_deleted', false)
              .order('created_at', { ascending: false })
              .limit(limit ?? 6);

            if (userData.role === 'agent') {
              query = query.eq('assigned_to', userData.id);
            }

            if (name)       query = query.ilike('full_name', `%${name}%`);
            if (lookingFor) query = query.ilike('looking_for', `%${lookingFor}%`);
            if (status)     query = query.ilike('status', `%${status}%`);
            if (priority)   query = query.ilike('priority', `%${priority}%`);
            if (source)     query = query.ilike('source', `%${source}%`);
            if (minBudgetL) query = query.gte('budget_max', minBudgetL * 100_000);
            if (maxBudgetL) query = query.lte('budget_min', maxBudgetL * 100_000);
            if (recentDays) {
              const since = new Date(Date.now() - recentDays * 86_400_000).toISOString();
              query = query.gte('created_at', since);
            }

            const { data, error } = await query;

            if (error) {
              console.error('[Tool Error: find_clients]', error);
              return { error: 'Database query failed.', clients: [], count: 0 };
            }

            // Filter by preferred location and BHK in memory
            let results = data || [];
            if (locality) {
              results = results.filter((c: any) =>
                c.preferred_locations?.some((loc: string) =>
                  loc.toLowerCase().includes(locality.toLowerCase())
                )
              );
            }
            if (bhk) {
              results = results.filter((c: any) =>
                c.preferred_bhks?.includes(bhk)
              );
            }

            const enriched = results.map((c: any) => ({
              ...c,
              budget_display: c.budget_min && c.budget_max
                ? `${fmtPrice(c.budget_min)} – ${fmtPrice(c.budget_max)}`
                : c.budget_max ? `up to ${fmtPrice(c.budget_max)}` : 'Not set',
            }));

            console.log(`[Tool: find_clients] Found ${enriched.length} results`);
            return { count: enriched.length, clients: enriched };
          },
        }),

        // ── 3. DRAFT CLIENT ─────────────────────────────────────────────────
        draft_client: tool({
          description: `
            Generate a preview draft of a new client/lead.
            Call this ONLY after you have gathered the required details from the user via conversation.
          `,
          inputSchema: z.object({
            full_name: z.string().describe("Client's full name"),
            phone: z.string().describe("Client's phone number"),
            looking_for: z.enum(["buy", "rent", "sell", "rent_owner", "lease"]).describe("What they are looking for"),
            property_types: z.array(z.string()).default([]).describe("e.g. ['apartment', 'villa', 'plot']"),
            preferred_locations: z.array(z.string()).default([]).describe("Locations they want"),
            budget_min: z.number().optional().describe("Minimum budget IN FULL RAW NUMBERS (e.g. 40 Lacs = 4000000, NOT 40)"),
            budget_max: z.number().optional().describe("Maximum budget IN FULL RAW NUMBERS (e.g. 1.5 Cr = 15000000, NOT 1.5)"),
            preferred_bhks: z.array(z.number()).default([]).describe("Only for residential"),
            preferred_commercial_type: z.enum(["shop", "space", "land"]).optional().describe("If commercial, specify shop, space, or land. e.g. commercial plot = land"),
            min_area_sqft: z.number().optional().describe("Area required in square feet/yards"),
            min_area_unit: z.enum(["sqft", "sqyard", "sqm", "gaj", "bigha"]).optional().describe("Unit for the area"),
            notes: z.string().optional().describe("Any extra requirements like 'ground floor', 'corner plot', 'east facing', etc."),
            priority: z.enum(["low", "medium", "high"]).default("medium"),
          }),
          execute: async (draft) => {
            return { type: 'draft', entity: 'client', data: draft };
          }
        }),

        // ── 4. DRAFT PROPERTY ───────────────────────────────────────────────
        draft_property: tool({
          description: "Generates a preview card for a new PROPERTY before saving to the database. Use this ONLY after gathering all required details (Type, Listing Type, Price, Locality, City) and auto-generating the Title and Description.",
          inputSchema: z.object({
            title: z.string().describe("Auto-generated professional title (e.g. Premium 3 BHK Villa in Vaishali Nagar)"),
            description: z.string().describe("Auto-generated detailed description"),
            property_type: z.enum(["apartment", "flat", "floor", "villa", "independent_house", "kothi", "plot", "commercial", "farmhouse", "penthouse", "farmer_land"]),
            listing_type: z.enum(["sale", "rent", "lease"]).default("sale"),
            price: z.coerce.number().describe("Price IN FULL RAW NUMBERS (e.g. 40 Lacs = 4000000)"),
            locality: z.string(),
            city: z.string(),
            bhk: z.array(z.coerce.number()).nullish().default([]),
            bedrooms: z.coerce.number().nullish(),
            bathrooms: z.coerce.number().nullish(),
            area_sqft: z.coerce.number().nullish(),
            area_unit: z.enum(["sqft", "sqyard", "sqm", "gaj", "bigha"]).nullish(),
            commercial_type: z.enum(["shop", "space", "land"]).nullish(),
            amenities: z.array(z.string()).nullish().default([]).describe("Array of amenities mentioned"),
            furnishing: z.enum(["unfurnished", "semi_furnished", "fully_furnished"]).nullish(),
            dimensions: z.string().nullish().describe("Dimensions of property e.g. 30x40"),
            road_info: z.string().nullish().describe("Road info e.g. 40ft road"),
            facing: z.string().nullish().describe("Facing direction e.g. east, north"),
            group: z.string().nullish().describe("Plot Group/Category e.g. commercial patta, residential"),
            approval_type: z.string().nullish().describe("Approval type e.g. JDA approved"),
            google_maps_url: z.string().nullish().describe("Google maps link if provided"),
            maintenance_charge: z.coerce.number().nullish().describe("Maintenance charge per month if applicable"),
            floor_number: z.string().nullish().describe("Floor number e.g. 2nd floor"),
            total_floors: z.string().nullish().describe("Total floors in building e.g. 10"),
            balconies: z.coerce.number().nullish().describe("Number of balconies"),
            parking: z.string().nullish().describe("Parking details e.g. 1 car parking"),
            seller_name: z.string().nullish(),
            seller_phone: z.string().nullish(),
          }),
          execute: async (draft: any) => {
            return { type: 'draft_property', data: draft };
          },
        }),

        // ── 5. SMART MATCH ──────────────────────────────────────────────────
        find_smart_matches: tool({
          description: `
            Find the best client↔property matches.
            Use when user asks "who should I pitch this to?", "find buyers for X property", or "find properties for Y client".
          `,
          inputSchema: z.object({
            propertyTitle: z.string().optional().describe('The name/title of the property to find matches for'),
            clientName:    z.string().optional().describe('The name of the client to find matching properties for'),
            limit:         z.number().optional().describe('Max matches to return, default 5'),
          }),
          execute: async ({ propertyTitle, clientName, limit }) => {
            console.log('[Tool: find_smart_matches]', { propertyTitle, clientName, limit });

            if (propertyTitle) {
              // Find property first
              const { data: propData } = await supabase
                .from('properties')
                .select('id, title')
                .eq('agency_id', AGENCY_ID)
                .eq('is_deleted', false)
                .ilike('title', `%${propertyTitle}%`)
                .limit(1)
                .single();

              if (!propData) return { error: `Property "${propertyTitle}" not found.`, matches: [], count: 0 };

              const { data, error } = await supabase
                .from('matches')
                .select('id, score, status, matched_at, client:clients(id, full_name, phone, looking_for, budget_min, budget_max, preferred_locations)')
                .eq('agency_id', AGENCY_ID)
                .eq('property_id', propData.id)
                .order('score', { ascending: false })
                .limit(limit ?? 5);

              if (error) {
                console.error('[Tool Error: find_smart_matches]', error);
                return { error: 'Database query failed.', matches: [], count: 0 };
              }
              return { count: data?.length ?? 0, property: propData.title, matches: data ?? [] };
            }

            if (clientName) {
              const { data: clientData } = await supabase
                .from('clients')
                .select('id, full_name')
                .eq('agency_id', AGENCY_ID)
                .eq('is_deleted', false)
                .ilike('full_name', `%${clientName}%`)
                .limit(1)
                .single();

              if (!clientData) return { error: `Client "${clientName}" not found.`, matches: [], count: 0 };

              const { data, error } = await supabase
                .from('matches')
                .select('id, score, status, matched_at, property:properties(id, title, locality, price, bhk, cover_image_url)')
                .eq('agency_id', AGENCY_ID)
                .eq('client_id', clientData.id)
                .order('score', { ascending: false })
                .limit(limit ?? 5);

              if (error) {
                console.error('[Tool Error: find_smart_matches]', error);
                return { error: 'Database query failed.', matches: [], count: 0 };
              }
              return { count: data?.length ?? 0, client: clientData.full_name, matches: data ?? [] };
            }

            return { error: 'Please specify a property title or client name to find matches.', matches: [], count: 0 };
          },
        }),

        // ── 4. AGENCY / TEAM STATS ─────────────────────────────────────────
        get_agency_stats: tool({
          description: `
            Get a summary of the agency's pipeline, bookings, leads, and revenue, or a specific team member's stats.
            Use for questions like: "how am I doing?", "agency stats", "bookings this month", "stats for [Agent Name]".
          `,
          inputSchema: z.object({
            period: z.string().optional().describe('Time period: "today", "week", "month", "year". Defaults to "month".'),
            agentName: z.string().optional().describe('Optional name of a team member to check their specific stats. Only admins can check other agents.'),
          }),
          execute: async ({ period, agentName }) => {
            console.log('[Tool: get_agency_stats]', { period, agentName });

            const now = new Date();
            let since: Date;
            switch (period) {
              case 'today': since = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
              case 'week':  since = new Date(now.getTime() - 7 * 86_400_000); break;
              case 'year':  since = new Date(now.getFullYear(), 0, 1); break;
              case 'all':   since = new Date(0); break;
              default:      since = new Date(now.getFullYear(), now.getMonth(), 1); // month
            }
            const sinceISO = since.toISOString();

            let targetUserId: string | null = null;
            let targetUserName: string = 'Agency / All';

            if (userData.role === 'agent') {
              targetUserId = userData.id;
              targetUserName = userData.full_name;
              if (agentName && agentName.toLowerCase() !== userData.full_name.toLowerCase()) {
                return { error: `Access denied: You can only view your own stats.`, period };
              }
            } else if (agentName) {
              const { data: user } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('agency_id', AGENCY_ID)
                .ilike('full_name', `%${agentName}%`)
                .limit(1)
                .single();
              if (user) {
                targetUserId = user.id;
                targetUserName = user.full_name;
              } else {
                return { error: `Could not find any team member named "${agentName}".`, period };
              }
            }

            // Build Queries
            let propQ = supabase.from('properties').select('status, created_by', { count: 'exact' }).eq('agency_id', AGENCY_ID).eq('is_deleted', false);
            let clientQ = supabase.from('clients').select('status, assigned_to, created_at', { count: 'exact' }).eq('agency_id', AGENCY_ID).eq('is_deleted', false);
            let bookQ = supabase.from('property_bookings').select('status, amount, booking_type, agent_id').eq('agency_id', AGENCY_ID).gte('created_at', sinceISO);
            let intQ = supabase.from('client_interactions').select('agent_id, type').eq('agency_id', AGENCY_ID).gte('created_at', sinceISO);
            
            if (targetUserId) {
              propQ = propQ.eq('created_by', targetUserId);
              clientQ = clientQ.eq('assigned_to', targetUserId);
              bookQ = bookQ.eq('agent_id', targetUserId);
              intQ = intQ.eq('agent_id', targetUserId);
            }

            // Run all queries in parallel — READ ONLY
            const [propertiesRes, clientsRes, bookingsRes, intRes] = await Promise.all([ propQ, clientQ, bookQ, intQ ]);

            // Fetch agents for leaderboard if admin and looking at agency-wide
            let agentsData: any[] = [];
            if (userData.role === 'admin' && !targetUserId) {
              const res = await supabase.from('profiles').select('id, full_name').eq('agency_id', AGENCY_ID);
              agentsData = res.data || [];
            }

            const properties = propertiesRes.data || [];
            const bookings = bookingsRes.data || [];
            const interactions = intRes.data || [];
            const clients = clientsRes.data || [];

            let actualProperties = properties;
            let actualClients = clients;
            let actualBookings = bookings;
            let actualInteractions = interactions;

            if (targetUserId) {
              actualProperties = properties.filter((p: any) => p.created_by === targetUserId);
              actualClients = clients.filter((c: any) => c.assigned_to === targetUserId);
              actualBookings = bookings.filter((b: any) => b.agent_id === targetUserId);
              actualInteractions = interactions.filter((i: any) => i.agent_id === targetUserId);
            }

            const propByStatus: Record<string, number> = {};
            actualProperties.forEach((p: any) => { propByStatus[p.status] = (propByStatus[p.status] || 0) + 1; });

            const activeBookings = actualBookings.filter((b: any) => b.status === 'active');
            const totalRevenue = activeBookings.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
            
            const totalLeadsCount = actualClients.length;

            let team_leaderboard: any = undefined;
            if (agentsData.length > 0) {
              team_leaderboard = agentsData.map(a => {
                const agentProps = properties.filter((p:any) => p.created_by === a.id);
                const agentLeads = clients.filter((c:any) => c.assigned_to === a.id);
                const agentBooks = bookings.filter((b:any) => b.agent_id === a.id);
                const agentInts = interactions.filter((i:any) => i.agent_id === a.id);
                return {
                  name: a.full_name,
                  properties_added: agentProps.length,
                  leads_added: agentLeads.length,
                  bookings_count: agentBooks.length,
                  calls_logged: agentInts.filter((i:any) => i.type === 'call').length,
                  revenue: agentBooks.reduce((sum:number, b:any) => sum + (b.amount || 0), 0)
                };
              }).sort((a,b) => b.revenue - a.revenue || b.properties_added - a.properties_added);
            }

            return {
              target: targetUserName,
              period: period || 'month',
              since: sinceISO,
              properties: {
                total: actualProperties.length,
                by_status: propByStatus,
              },
              leads: {
                total: totalLeadsCount,
                new_this_period: totalLeadsCount, // fallback for older clients
              },
              bookings: {
                total: actualBookings.length,
                active: activeBookings.length,
                total_revenue: totalRevenue,
                total_revenue_formatted: fmtPrice(totalRevenue),
              },
              interactions: {
                calls_logged: actualInteractions.filter((i:any) => i.type === 'call').length,
              },
              ...(team_leaderboard && { team_leaderboard })
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error('[Chat API Error]', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
