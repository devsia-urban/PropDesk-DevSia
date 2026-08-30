-- 1. Make pincode nullable in properties table
ALTER TABLE properties ALTER COLUMN pincode DROP NOT NULL;

-- 2. (Optional) You can also do the same for clients if needed, 
-- but the request for now is specifically for the property upload form.
-- ALTER TABLE clients ALTER COLUMN "locality" DROP NOT NULL; -- if needed
