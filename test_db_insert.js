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
  const { data, error } = await supabase.from('profiles').insert([{
    id: '4f0b55e8-e83f-46f6-b2b4-884ef0c630d9',
    email: 'devsiaurban@gmail.com',
    full_name: 'Dev Sia',
    role: 'admin',
    agency_id: null
  }]);
  console.log("INSERT RESULT:", { data, error });
}
check();
