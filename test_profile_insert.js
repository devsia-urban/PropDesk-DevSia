const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://uesgvncduysqgrnmmvpm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlc2d2bmNkdXlzcWdybm1tdnBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ2NDgzMywiZXhwIjoyMTAzMDQwODMzfQ.k8kAn6brUsL7_3661yCeyrOK0O31DFf8LgkBu0soFq8'
);

async function test() {
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  if (users?.users?.length > 0) {
    const user = users.users[0]; // grab any user
    console.log('Testing insert for user:', user.id, user.email);
    
    const { error: insertError } = await supabaseAdmin.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || 'Team Member',
      agency_id: user.user_metadata?.agency_id || null, 
      role: user.user_metadata?.role || 'agent'
    });
    console.log('Insert Error:', insertError);
  }
}

test();
