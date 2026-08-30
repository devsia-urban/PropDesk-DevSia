const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uesgvncduysqgrnmmvpm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlc2d2bmNkdXlzcWdybm1tdnBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ2NDgzMywiZXhwIjoyMTAzMDQwODMzfQ.k8kAn6brUsL7_3661yCeyrOK0O31DFf8LgkBu0soFq8'
);

async function test() {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail('test_invite_error@example.com', {
    data: { agency_id: 'test', role: 'agent' },
    redirectTo: 'http://localhost:3000/accept-invite'
  });
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
