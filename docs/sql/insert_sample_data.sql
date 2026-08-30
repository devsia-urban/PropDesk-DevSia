-- PROFESSIONAL SAMPLE DATA INSERTION (Jaipur Real Estate)
-- Run this in your Supabase SQL Editor.

-- 1. CLEANUP (Optional - Uncomment if you want to start fresh)
-- TRUNCATE properties CASCADE;

-- 2. INSERT SAMPLES
-- NOTE: Uses dynamic subqueries to get agency_id and creator_id automatically.

INSERT INTO properties (
    agency_id, created_by, title, description, property_type, status, listing_type, 
    price, price_negotiable, locality, city, pincode, address, 
    bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing, 
    facing, road_info, is_featured, is_new, slug, amenities, balconies, "group"
)
SELECT 
    agency_id, id as created_by,
    'Luxury 3BHK Apartment in Vaishali' as title,
    'Beautifully designed 3BHK flat with premium finishing, wooden flooring in master bedroom, and state-of-the-art kitchen. Located in the heart of Vaishali Nagar with all modern amenities.' as description,
    'apartment' as property_type, 'available' as status, 'sale' as listing_type,
    8500000 as price, true as price_negotiable, 'Vaishali Nagar' as locality, 'Jaipur' as city, '302021' as pincode, 'Near Gandhi Path' as address,
    ARRAY[3] as bhk, 3 as bedrooms, 3 as bathrooms, 1850 as area_sqft, 'sqft' as area_unit, 'fully_furnished' as furnishing,
    'North-East' as facing, '60ft Road' as road_info, true as is_featured, true as is_new, 'luxury-3bhk-vaishali' as slug,
    ARRAY['Swimming Pool', 'Gym', 'Security 24/7', 'Power Backup', 'Clubhouse'] as amenities, 2 as balconies, NULL as "group"
FROM profiles LIMIT 1;

INSERT INTO properties (
    agency_id, created_by, title, description, property_type, status, listing_type, 
    price, price_negotiable, locality, city, pincode, address, 
    bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing, 
    facing, road_info, is_featured, is_new, slug, amenities, balconies, "group"
)
SELECT 
    agency_id, id as created_by,
    'Premium JDA Plot - Mansarovar Extension' as title,
    'East facing JDA approved residential plot in a well-developed colony. 40ft wide road access. Perfect for immediate construction.' as description,
    'plot' as property_type, 'available' as status, 'sale' as listing_type,
    4500000 as price, false as price_negotiable, 'Mansarovar Extension' as locality, 'Jaipur' as city, '302020' as pincode, 'Sector 12' as address,
    ARRAY[]::integer[] as bhk, NULL as bedrooms, NULL as bathrooms, 166 as area_sqft, 'gaj' as area_unit, NULL as furnishing,
    'East' as facing, '40ft Road' as road_info, false as is_featured, true as is_new, 'jda-plot-mansarovar' as slug,
    ARRAY['Security 24/7', 'Park'] as amenities, NULL as balconies, 'JDA Scheme Plots' as "group"
FROM profiles LIMIT 1;

INSERT INTO properties (
    agency_id, created_by, title, description, property_type, status, listing_type, 
    price, price_negotiable, locality, city, pincode, address, 
    bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing, 
    facing, road_info, is_featured, is_new, slug, amenities, balconies, "group"
)
SELECT 
    agency_id, id as created_by,
    'Elite 4BHK Independent Villa' as title,
    'Spacious independent villa with private garden, servant quarter, and modern elevation. High ceilings and high-end bath fittings.' as description,
    'villa' as property_type, 'available' as status, 'sale' as listing_type,
    22500000 as price, true as price_negotiable, 'Patrakar Colony' as locality, 'Jaipur' as city, '302020' as pincode, 'Near Iskcon Temple' as address,
    ARRAY[4] as bhk, 4 as bedrooms, 4 as bathrooms, 3200 as area_sqft, 'sqft' as area_unit, 'semi_furnished' as furnishing,
    'East' as facing, '30ft Road' as road_info, true as is_featured, true as is_new, 'elite-4bhk-villa-patrakar' as slug,
    ARRAY['Security 24/7', 'Car Parking', 'CCTV', 'Power Backup'] as amenities, 3 as balconies, NULL as "group"
FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, bhk, area_sqft, area_unit, furnishing, "group")
SELECT agency_id, id, 'Prime Agricultural Land', 'Large farm land near Chomu highway. 30ft road access.', 'farmhouse', 'available', 'sale', 12000000, 'Jagatpura', 'Jaipur', ARRAY[]::integer[], 1500, 'gaj', NULL, 'Society Patta Plots' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing)
SELECT agency_id, id, 'Modern 2BHK Flat', 'Compact and efficient 2BHK flat in Jagatpura.', 'apartment', 'available', 'sale', 3800000, 'Jagatpura', 'Jaipur', ARRAY[2], 2, 2, 1050, 'sqft', 'semi_furnished' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing)
SELECT agency_id, id, 'Spacious 3BHK Flat', 'Ready to move 3BHK flat in Pratap Nagar.', 'apartment', 'available', 'sale', 5200000, 'Pratap Nagar', 'Jaipur', ARRAY[3], 3, 2, 1450, 'sqft', 'unfurnished' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing)
SELECT agency_id, id, 'Cozy 1BHK Studio', 'Perfect for bachelors or small families.', 'apartment', 'available', 'rent', 12000, 'Malviya Nagar', 'Jaipur', ARRAY[1], 1, 1, 550, 'sqft', 'fully_furnished' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, area_sqft, area_unit, "group")
SELECT agency_id, id, 'Gated Society Plot', 'Security and peace of mind.', 'plot', 'available', 'sale', 3200000, 'Ajmer Road', 'Jaipur', 150, 'gaj', 'Gated Society Plots' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, area_sqft, area_unit, "group")
SELECT agency_id, id, 'Corner Plot - JDA Scheme', 'Ideal for front-facing shop or residence.', 'plot', 'available', 'sale', 6500000, 'Sirsi Road', 'Jaipur', 250, 'gaj', 'JDA Scheme Plots' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing)
SELECT agency_id, id, 'Luxury Penthouse', 'Top floor with roof rights.', 'penthouse', 'available', 'sale', 13500000, 'C-Scheme', 'Jaipur', ARRAY[4], 4, 4, 3500, 'sqft', 'fully_furnished' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, area_sqft, area_unit)
SELECT agency_id, id, 'Industrial Plot', 'VKI Area industrial plot.', 'commercial', 'available', 'sale', 25000000, 'VKI Area', 'Jaipur', 500, 'gaj' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing)
SELECT agency_id, id, 'Independent Floor', 'First floor of a duplex house.', 'independent_house', 'available', 'rent', 25000, 'Raja Park', 'Jaipur', ARRAY[3], 3, 3, 1800, 'sqft', 'semi_furnished' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing)
SELECT agency_id, id, 'Studio Apartment', 'Fully managed studio flat.', 'apartment', 'available', 'rent', 15000, 'Siddharth Nagar', 'Jaipur', ARRAY[1], 1, 1, 450, 'sqft', 'fully_furnished' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing)
SELECT agency_id, id, 'Duplex Villa', 'Modern design duplex villa.', 'villa', 'available', 'sale', 8800000, 'Kalwar Road', 'Jaipur', ARRAY[3], 3, 3, 1550, 'sqft', 'semi_furnished' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, area_sqft, area_unit, "group")
SELECT agency_id, id, 'Small Plot Jagatpura', 'Affordable plot for investment.', 'plot', 'available', 'sale', 2200000, 'Jagatpura', 'Jaipur', 90, 'gaj', 'Other JDA Patta Plots' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing)
SELECT agency_id, id, 'Spacious 4BHK Flat', 'Premium complex flat.', 'apartment', 'available', 'sale', 9500000, 'Gandhi Nagar', 'Jaipur', ARRAY[4], 4, 3, 2100, 'sqft', 'semi_furnished' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, area_sqft, area_unit, "group")
SELECT agency_id, id, 'Highway Touch Land', 'Potential for commercial use.', 'farmhouse', 'available', 'sale', 45000000, 'Tonk Road', 'Jaipur', 2500, 'gaj', 'Society Patta Plots' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing)
SELECT agency_id, id, 'Cozy 2BHK Villa', 'Small gated community villa.', 'villa', 'available', 'sale', 5500000, 'Sanganer', 'Jaipur', ARRAY[2], 2, 2, 1100, 'sqft', 'unfurnished' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, bhk, bedrooms, bathrooms, area_sqft, area_unit, furnishing)
SELECT agency_id, id, 'Modern Independent House', 'Vastu compliant house.', 'independent_house', 'available', 'sale', 11500000, 'Shyam Nagar', 'Jaipur', ARRAY[4], 4, 4, 2500, 'sqft', 'semi_furnished' FROM profiles LIMIT 1;

INSERT INTO properties (agency_id, created_by, title, description, property_type, status, listing_type, price, locality, city, area_sqft, area_unit, "group")
SELECT agency_id, id, 'Commercial Plot', 'Main road facing commercial land.', 'commercial', 'available', 'sale', 18000000, 'Muralipura', 'Jaipur', 180, 'gaj', 'JDA Scheme Plots' FROM profiles LIMIT 1;
