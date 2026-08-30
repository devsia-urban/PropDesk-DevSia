-- HOW TO ADD A NEW AGENCY & LINK YOURSELF
-- Run these commands in your Supabase SQL Editor.

-- 1. Create the new Agency
-- Replace 'Your Agency Name' with the actual name.
-- You can also specify a custom UUID if you want, or let it generate one.
INSERT INTO agencies (name, contact_email)
VALUES ('Your New Agency Name', 'contact@newagency.com')
RETURNING id; 

-- 2. Link your existing User Profile to this Agency
-- Replace 'COPIED_AGENCY_ID' with the ID you got from the step above.
-- Replace 'YOUR_USER_ID' with your actual Supabase Auth UUID.
UPDATE profiles 
SET agency_id = 'COPIED_AGENCY_ID', role = 'admin'
WHERE id = 'YOUR_USER_ID';
