import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';

// Load environment variables (like your API key) from .env.local
dotenv.config({ path: '.env.local' });

// Ensure you have added GEMINI_API_KEY to your .env.local file
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ ERROR: Please add GEMINI_API_KEY to your .env.local file.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: apiKey });

// ----------------------------------------------------------------------
// 1. Define our Mock Database Functions
// In production, these will query Supabase with the logged-in agency_id
// ----------------------------------------------------------------------

async function findProperties(args: { bhk?: number; location?: string; maxBudget?: number; agencyId: string }) {
  console.log(`\n[DATABASE TOOL EXECUTED] Searching properties for Agency ${args.agencyId}...`);
  console.log(`[PARAMETERS] BHK: ${args.bhk || 'Any'}, Location: ${args.location || 'Any'}, Max Budget: ${args.maxBudget ? args.maxBudget + ' Cr' : 'Any'}\n`);
  
  // MOCK DATA (In production, this would be a Supabase query)
  const mockProperties = [
    { id: 1, title: 'Luxury 3BHK in DLF Phase 5', bhk: 3, location: 'Gurgaon', priceCr: 2.5, status: 'available' },
    { id: 2, title: 'Standard 2BHK in South City', bhk: 2, location: 'Gurgaon', priceCr: 1.2, status: 'available' },
    { id: 3, title: 'Premium 3BHK in Golf Course Road', bhk: 3, location: 'Gurgaon', priceCr: 4.0, status: 'available' }
  ];

  // Filter based on AI's requested parameters
  return mockProperties.filter(p => {
    if (args.bhk && p.bhk !== args.bhk) return false;
    if (args.location && !p.location.toLowerCase().includes(args.location.toLowerCase())) return false;
    if (args.maxBudget && p.priceCr > args.maxBudget) return false;
    return true;
  });
}

// ----------------------------------------------------------------------
// 2. Define the Tools for Gemini
// ----------------------------------------------------------------------

const propertySearchTool = {
  name: 'find_properties',
  description: 'Searches the agency database for available properties based on client requirements.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      bhk: { type: Type.INTEGER, description: 'Number of bedrooms (e.g. 2, 3, 4)' },
      location: { type: Type.STRING, description: 'City or area name' },
      maxBudget: { type: Type.NUMBER, description: 'Maximum budget in Crores (Cr)' }
    }
  }
};

// ----------------------------------------------------------------------
// 3. Run the AI Conversation Test
// ----------------------------------------------------------------------

async function runOfflineTest() {
  console.log("🚀 Starting PropDesk AI Copilot Offline Test...\n");

  // We hardcode the agency_id to prove the AI only accesses this agency's data
  const AGENCY_ID = "a4343385-6e4b-4303-9b8c-19b51374639c"; // Logo agency

  // Initialize the chat session with instructions and tools
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash', // Using the blazing fast and extremely cheap Flash model
    config: {
      systemInstruction: "You are the PropDesk AI Copilot. You assist Indian real estate brokers in managing their leads and properties. Always be professional, concise, and helpful. Format prices in Indian Rupees/Crores.",
      tools: [{ functionDeclarations: [propertySearchTool] }]
    }
  });

  const testMessage = "Find me some available 3BHK properties in Gurgaon under 3 Cr for a client.";
  console.log(`USER: "${testMessage}"\n`);
  console.log("🤖 AI is thinking...\n");

  // Send the message to the AI
  const response = await chat.sendMessage({ message: testMessage });

  // Handle Function Calling
  if (response.functionCalls && response.functionCalls.length > 0) {
    for (const call of response.functionCalls) {
      if (call.name === 'find_properties') {
        const args = call.args as { bhk?: number; location?: string; maxBudget?: number };
        
        // EXECUTE THE DATABASE QUERY (Forcefully injecting the agency_id for security)
        const dbResult = await findProperties({ ...args, agencyId: AGENCY_ID });
        
        // Send the database result back to the AI so it can summarize it
        const finalResponse = await chat.sendMessage({
          message: [{
            functionResponse: {
              name: 'find_properties',
              response: { result: dbResult }
            }
          }]
        });

        console.log("🤖 AI COPILOT:");
        console.log(finalResponse.text);
      }
    }
  } else {
    // If the AI didn't need to call a tool (e.g. just answering a general question)
    console.log("🤖 AI COPILOT:");
    console.log(response.text);
  }

  // TEST MEMORY (Context)
  console.log("\n------------------------------------------------------");
  console.log("🧪 TESTING MEMORY (Follow-up Question)...\n");
  
  const followUpMessage = "What was the price of the first one?";
  console.log(`USER: "${followUpMessage}"\n`);
  
  const memoryResponse = await chat.sendMessage({ message: followUpMessage });
  console.log("🤖 AI COPILOT:");
  console.log(memoryResponse.text);
}

runOfflineTest().catch(console.error);
