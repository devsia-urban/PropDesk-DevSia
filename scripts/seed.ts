/**
 * Run once after schema setup: npx ts-node -r tsconfig-paths/register scripts/seed.ts
 */

import { supabaseAdmin } from "@/lib/supabase/admin"

async function seed() {
  // // console.log("Starting seed process...")

  // 1. Create Agency
  const { data: agency, error: agencyError } = await supabaseAdmin
    .from('agencies')
    .insert({
      name: "Sharma Properties, Jaipur",
      address: "Vaishali Nagar, Jaipur",
      contact_phone: "+91 9876543210",
      contact_email: "contact@sharmaprop.com",
      rera_number: "RAJ/P/2024/1234"
    })
    .select()
    .single()

  if (agencyError) {
    console.error("Error creating agency:", agencyError)
    return
  }
  // // console.log("Created agency:", agency.name)

  // 2. Create Admin User
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@sharmaprop.com",
    password: "Admin@1234",
    email_confirm: true,
    user_metadata: {
      full_name: "Ravi Kumar",
      role: "admin",
      agency_id: agency.id
    }
  })

  if (authError) {
    console.error("Error creating auth user:", authError)
    // Note: If user exists, we continue
  } else {
    // // console.log("Created auth user:", authUser.user.email)
  }

  // Reference for inserts
  const adminId = authUser?.user?.id

  // 3. Insert 5 Sample Properties



  // 4. Insert 4 Sample Clients
  const clients = [
    {
      agency_id: agency.id,
      created_by: adminId,
      full_name: "Priya Sharma",
      phone: "+91 9123456789",
      email: "priya@example.com",
      source: "walk_in" as const,
      status: "active" as const,
      looking_for: "buy" as const,
      property_types: ["apartment"],
      preferred_bhks: [3],
      preferred_locations: ["Vaishali Nagar", "C-Scheme"],
      budget_min: 6000000,
      budget_max: 12000000,
      min_bedrooms: 3
    },
    {
      agency_id: agency.id,
      created_by: adminId,
      full_name: "Anil Chandra",
      phone: "+91 9234567890",
      email: "anil@example.com",
      source: "referral" as const,
      status: "active" as const,
      looking_for: "buy" as const,
      property_types: ["apartment"],
      preferred_bhks: [2],
      preferred_locations: ["Mansarovar"],
      budget_min: 4000000,
      budget_max: 6000000,
      min_bedrooms: 2
    },
    {
      agency_id: agency.id,
      created_by: adminId,
      full_name: "Sneha Kapoor",
      phone: "+91 9345678901",
      email: "sneha@example.com",
      status: "active" as const,
      looking_for: "buy" as const,
      property_types: ["villa", "independent_house"],
      preferred_bhks: [4, 5],
      preferred_locations: ["Bani Park", "Civil Lines"],
      budget_min: 15000000,
      budget_max: 25000000,
      min_bedrooms: 4
    },
    {
      agency_id: agency.id,
      created_by: adminId,
      full_name: "Rahul Singh",
      phone: "+91 9456789012",
      email: "rahul@example.com",
      status: "active" as const,
      looking_for: "buy" as const,
      property_types: ["apartment"],
      preferred_bhks: [1, 2],
      preferred_locations: ["Jagatpura"],
      budget_min: 3000000,
      budget_max: 4500000,
      min_bedrooms: 1
    }
  ]

  const { error: clientError } = await supabaseAdmin.from('clients').insert(clients)
  if (clientError) {
    console.error("Error seeding clients:", clientError)
  } else {
    console.log("Seeded 4 sample clients")
  }

  console.log("Seed complete!")
}

seed()
