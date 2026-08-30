const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n');
let supabaseUrl = '';
let supabaseServiceKey = '';

for (const line of env) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseServiceKey = line.split('=')[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data, error } = await supabase.from('property_bookings').select('*').limit(1);
  if (error) {
    console.error("ERROR:", error);
  } else if (data.length > 0) {
    console.log("COLUMNS:", Object.keys(data[0]));
  } else {
    // If empty, insert a dummy to see columns, or just use rpc? We don't have rpc for information_schema.
    console.log("Empty table, inserting dummy to see columns...");
    const { error: insertError } = await supabase.from('property_bookings').insert([{ id: '00000000-0000-0000-0000-000000000000' }]);
    console.log(insertError);
  }
}
check();
