const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAgency() {
  // Update the agency linked to the user's profile
  const { data, error } = await supabase
    .from('agencies')
    .update({ subscription_end_date: '2026-08-25T00:00:00+00:00', subscription_status: 'trial' })
    .eq('id', 'ae552bac-4d64-47bd-b3e0-555c3088a067');
  
  if (error) {
    console.error('Error updating agency:', error);
  } else {
    console.log('Successfully updated the correct agency (ae552bac-4d64-47bd-b3e0-555c3088a067) to end on 2026-08-25!');
  }
}

fixAgency();
