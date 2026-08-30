require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function injectAgencyId() {
  const { data, error } = await supabase.from('agencies').select('id, name').limit(1);
  if (error) {
    console.error("Error fetching agency:", error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log("No agencies found in the database.");
    return;
  }

  const agencyId = data[0].id;
  console.log(`Found Agency: ${data[0].name} (ID: ${agencyId})`);

  const csvPath = path.join(__dirname, 'public/excel-upload/FINAL_CLEAN_DATA.csv');
  let csvContent = fs.readFileSync(csvPath, 'utf8');
  
  const lines = csvContent.split('\n');
  const headers = lines[0].trim();
  
  // Only inject if it doesn't already have agency_id
  if (!headers.includes('agency_id')) {
    lines[0] = headers + ',agency_id';
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        lines[i] = lines[i].trim() + ',' + agencyId;
      }
    }
    fs.writeFileSync(csvPath, lines.join('\n'));
    console.log("Successfully injected agency_id into FINAL_CLEAN_DATA.csv!");
  } else {
    console.log("agency_id is already in the CSV.");
  }
}

injectAgencyId();
