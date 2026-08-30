require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data, error } = await supabase
    .from('units')
    .select(`
      *,
      scheme:schemes(*, builder:builders(*))
    `)
    .eq('id', 'becdb1ad-2bcd-439b-93cc-1f9dbf71a89b')
  console.log("Data:", JSON.stringify(data, null, 2))
  console.log("Error:", error)
}
run()
