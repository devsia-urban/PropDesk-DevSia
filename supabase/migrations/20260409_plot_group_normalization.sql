-- Normalization of Plot Group labels (2026-04-09)
-- Shortening names for cleaner UI and consistency

-- 1. Update existing properties to use the new shorter group names
UPDATE properties SET "group" = 'JDA Scheme' WHERE "group" = 'JDA Scheme Plots';
UPDATE properties SET "group" = 'Gated Society' WHERE "group" = 'Gated Society Plots';
UPDATE properties SET "group" = 'JDA Patta' WHERE "group" = 'Other JDA Patta Plots';
UPDATE properties SET "group" = 'Society Patta' WHERE "group" = 'Society Patta Plots';

-- 2. Update the global agency options library so old names don't keep reappearing in suggestions
UPDATE agency_plot_groups SET name = 'JDA Scheme' WHERE name = 'JDA Scheme Plots';
UPDATE agency_plot_groups SET name = 'Gated Society' WHERE name = 'Gated Society Plots';
UPDATE agency_plot_groups SET name = 'JDA Patta' WHERE name = 'Other JDA Patta Plots';
UPDATE agency_plot_groups SET name = 'Society Patta' WHERE name = 'Society Patta Plots';

-- 3. Note: The frontend constants in property-form.tsx have also been updated to match these strings.
