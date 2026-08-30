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
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  console.log("AUTH USERS:", users?.users?.map(u => ({ id: u.id, email: u.email })));
  
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
  console.log("PROFILES:", profiles);
}
check();
