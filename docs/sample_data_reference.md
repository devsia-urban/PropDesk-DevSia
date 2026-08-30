# Sample Data — Properties & Clients

Run the SQL blocks below in your **Supabase SQL Editor**.

> [!IMPORTANT]
> Replace the values in the `SET` block at the top with your actual IDs before running.
> You can find them by running `SELECT id FROM agencies LIMIT 1` and `SELECT id FROM profiles LIMIT 1`.

## Step 1 — Set your IDs

```sql
-- ✏️ Replace these with your real IDs
DO $$
DECLARE
  v_agency  uuid := 'c2fabfdb-5226-46bb-bc07-aeb933c54ecf'; -- your agency id
  v_profile uuid := 'cd6a96f7-c40c-40c8-9cfc-fd079e22eebc'; -- your profile id
BEGIN

-- ────────────── PROPERTIES ──────────────
INSERT INTO properties (
  agency_id, created_by, title, description, property_type, status,
  price, price_negotiable, maintenance_charge,
  address, city, locality, pincode,
  bedrooms, bathrooms, area_sqft, floor_number, total_floors,
  facing, furnishing, parking, image_urls, cover_image_url, is_deleted
) VALUES

-- 1. Luxury Villa – Vaishali Nagar
(v_agency, v_profile,
 '5BHK Luxury Villa in Vaishali Nagar',
 'Spacious 5BHK villa with private garden, modular kitchen, and 24/7 security. Best for large families.',
 'villa', 'available',
 45000000, true, 8000,
 '12 Civil Lines Road', 'Jaipur', 'Vaishali Nagar', '302021',
 5, 4, 3200, NULL, '2',
 'North', 'fully_furnished', '2 Car + 1 Bike',
 '{}', NULL, false),

-- 2. 3BHK Apartment – Malviya Nagar
(v_agency, v_profile,
 '3BHK Premium Apartment – Malviya Nagar',
 'Ready-to-move apartment in a gated society. Close to metro, schools and malls.',
 'apartment', 'available',
 12500000, false, 4500,
 'D-45 Sunrise Society', 'Jaipur', 'Malviya Nagar', '302017',
 3, 2, 1450, '5', '12',
 'East', 'semi_furnished', '1 Car',
 '{}', NULL, false),

-- 3. Commercial Office – MI Road
(v_agency, v_profile,
 'Commercial Office Space – MI Road',
 'Prime commercial space on MI Road, ideal for a mid-sized office setup. Ample parking.',
 'commercial', 'available',
 25000000, true, 12000,
 '14 MI Road', 'Jaipur', 'MI Road', '302001',
 0, 2, 2100, '3', '10',
 'West', 'fully_furnished', '5 Basement Slots',
 '{}', NULL, false),

-- 4. 2BHK Flat – Bani Park (for rent)
(v_agency, v_profile,
 '2BHK Flat for Rent – Bani Park',
 'Well-maintained 2BHK flat available for rent. Ideal for working professionals or small families.',
 'apartment', 'available',
 35000, false, 2000,
 'B-12 Bani Park Colony', 'Jaipur', 'Bani Park', '302016',
 2, 2, 1100, '2', '4',
 'South', 'semi_furnished', '1 Covered',
 '{}', NULL, false),

-- 5. Independent House – Sanganer
(v_agency, v_profile,
 '4BHK Independent House – Sanganer',
 'Corner-plot house with terrace, open kitchen, and dedicated servant quarter.',
 'independent_house', 'available',
 8500000, false, 0,
 'Plot 33 Ram Nagar', 'Jaipur', 'Sanganer', '302029',
 4, 3, 2400, NULL, '2',
 'East', 'unfurnished', '2 Open',
 '{}', NULL, false);


-- ────────────── CLIENTS ──────────────
INSERT INTO clients (
  agency_id, created_by, assigned_to,
  full_name, phone, email, source,
  notes, status, priority, follow_up_date,
  looking_for, property_types, preferred_bhks, preferred_locations,
  budget_min, budget_max, min_bedrooms, min_area_sqft,
  furnishing_preference, possession_timeline, is_deleted
) VALUES

-- 1. High-budget villa buyer
(v_agency, v_profile, v_profile,
 'Ramesh Agarwal', '9810001234', 'ramesh.agarwal@email.com', 'referral',
 'Looking for villa in Vaishali Nagar or C-Scheme. Prefers fully furnished.',
 'active', 'high', (CURRENT_DATE + INTERVAL '3 days')::date,
 'buy', ARRAY['villa']::text[], ARRAY[4,5]::integer[], ARRAY['Vaishali Nagar','C-Scheme'],
 30000000, 60000000, 4, 2500,
 'Fully', 'Immediate', false),

-- 2. Young professional renter
(v_agency, v_profile, v_profile,
 'Sneha Mehra', '9820002345', 'sneha.mehra@email.com', 'property_portal',
 'Software engineer, wants flat near metro. Budget ₹30–45k/mo.',
 'active', 'medium', (CURRENT_DATE + INTERVAL '7 days')::date,
 'rent', ARRAY['apartment']::text[], ARRAY[2,3]::integer[], ARRAY['Malviya Nagar','Bani Park','Vaishali Nagar'],
 25000, 50000, 2, 900,
 'Semi', 'Within 1 month', false),

-- 3. Mid-budget apartment buyer
(v_agency, v_profile, v_profile,
 'Vikram Choudhary', '9830003456', 'vikram.c@email.com', 'walk_in',
 'First-time buyer. Wants 3BHK in a gated society. Open to east or south Jaipur.',
 'active', 'high', (CURRENT_DATE + INTERVAL '5 days')::date,
 'buy', ARRAY['apartment']::text[], ARRAY[3]::integer[], ARRAY['Malviya Nagar','Sanganer','Mansarovar'],
 8000000, 15000000, 3, 1200,
 'Semi', 'Within 3 months', false),

-- 4. Commercial space buyer
(v_agency, v_profile, v_profile,
 'Priti Investments Pvt Ltd', '9840004567', 'priti.inv@corp.com', 'cold_call',
 'Looking for office/commercial space on MI Road or adjoining areas.',
 'active', 'medium', (CURRENT_DATE + INTERVAL '14 days')::date,
 'buy', ARRAY['commercial']::text[], ARRAY[]::integer[], ARRAY['MI Road','C-Scheme','Tonk Road'],
 15000000, 35000000, 0, 1500,
 'Fully', 'Within 6 months', false),

-- 5. Budget buyer – independent house
(v_agency, v_profile, v_profile,
 'Deepak Sharma', '9850005678', 'deepak.sh@email.com', 'social_media',
 'Joint family, 4+ BHK independent house. Any location okay in Jaipur.',
 'active', 'low', (CURRENT_DATE + INTERVAL '21 days')::date,
 'buy', ARRAY['independent_house','villa']::text[], ARRAY[4,5]::integer[], ARRAY['Sanganer','Mansarovar','Jagatpura'],
 5000000, 12000000, 4, 1800,
 NULL, 'Within 6 months', false);

END $$;
```

## What this inserts

| # | Type | Details |
|---|------|---------|
| P1 | 🏡 Villa | 5BHK, 3200 sqft, ₹4.5Cr, Vaishali Nagar |
| P2 | 🏢 Apartment | 3BHK, 1450 sqft, ₹1.25Cr, Malviya Nagar |
| P3 | 🏬 Commercial | 2100 sqft, ₹2.5Cr, MI Road |
| P4 | 🏢 Rental Flat | 2BHK, ₹35k/mo, Bani Park |
| P5 | 🏠 House | 4BHK, 2400 sqft, ₹85L, Sanganer |
| C1 | 👤 Ramesh Agarwal | Buy villa, ₹3–6Cr, 4-5BHK |
| C2 | 👤 Sneha Mehra | Rent apt, ₹25–50k, 2-3BHK |
| C3 | 👤 Vikram Choudhary | Buy apt, ₹80L–1.5Cr, 3BHK |
| C4 | 👤 Priti Investments | Buy commercial, ₹1.5–3.5Cr |
| C5 | 👤 Deepak Sharma | Buy house, ₹50L–1.2Cr, 4BHK |

> [!TIP]
> After inserting, go to `/matches` and click **"Run match for all"** to generate scores. You should see P1↔C1, P2↔C2, P2↔C3, P3↔C4, P5↔C5 as likely high-confidence matches.
