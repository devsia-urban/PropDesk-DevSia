const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://uesgvncduysqgrnmmvpm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlc2d2bmNkdXlzcWdybm1tdnBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ2NDgzMywiZXhwIjoyMTAzMDQwODMzfQ.k8kAn6brUsL7_3661yCeyrOK0O31DFf8LgkBu0soFq8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('clients').select('id, follow_up_date').not('follow_up_date', 'is', null).limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}
run();
