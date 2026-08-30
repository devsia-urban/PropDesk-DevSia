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
  const { count, error } = await supabase.from('property_bookings').select('*', { count: 'exact', head: true });
  console.log("BOOKINGS COUNT:", count, error);
}
check();
