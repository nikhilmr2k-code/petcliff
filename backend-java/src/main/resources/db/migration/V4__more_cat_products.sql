-- Round out the cat range so cat category filters aren't empty.
-- Idempotent: each row inserts only if its slug is absent. Placeholder images (swapped to media later).

INSERT INTO products (id, slug, name, category, pet_type, price_cents, compare_at_cents, image_url, description, inventory_count, metadata)
SELECT gen_random_uuid(), 'cat-airtag-collar-holder', 'Cat AirTag Collar Holder', 'accessories', 'cat', 1600, NULL,
       'https://placehold.co/600x600?text=Cat+AirTag+Holder', 'Cat AirTag Collar Holder — high-fashion monochrome essentials for pets that thrive.', 50,
       '{"subtype":"airtag","color":"Black","rating":5}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'cat-airtag-collar-holder');

INSERT INTO products (id, slug, name, category, pet_type, price_cents, compare_at_cents, image_url, description, inventory_count, metadata)
SELECT gen_random_uuid(), 'cat-travel-bowl', 'Cat Travel Bowl', 'accessories', 'cat', 1400, NULL,
       'https://placehold.co/600x600?text=Cat+Travel+Bowl', 'Cat Travel Bowl — high-fashion monochrome essentials for pets that thrive.', 50,
       '{"subtype":"bowl","color":"White","rating":5}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'cat-travel-bowl');

INSERT INTO products (id, slug, name, category, pet_type, price_cents, compare_at_cents, image_url, description, inventory_count, metadata)
SELECT gen_random_uuid(), 'cat-window-perch', 'Cat Window Perch', 'resting', 'cat', 3900, NULL,
       'https://placehold.co/600x600?text=Cat+Window+Perch', 'Cat Window Perch — high-fashion monochrome essentials for pets that thrive.', 50,
       '{"subtype":"perch","color":"Black","rating":5}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'cat-window-perch');

INSERT INTO products (id, slug, name, category, pet_type, price_cents, compare_at_cents, image_url, description, inventory_count, metadata)
SELECT gen_random_uuid(), 'cat-grooming-glove', 'Cat Grooming Glove', 'grooming', 'cat', 1500, NULL,
       'https://placehold.co/600x600?text=Cat+Grooming+Glove', 'Cat Grooming Glove — high-fashion monochrome essentials for pets that thrive.', 50,
       '{"subtype":"glove","color":"Black","rating":5}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'cat-grooming-glove');

INSERT INTO products (id, slug, name, category, pet_type, price_cents, compare_at_cents, image_url, description, inventory_count, metadata)
SELECT gen_random_uuid(), 'cat-catnip-kicker', 'Catnip Kicker Toy', 'toys', 'cat', 1200, NULL,
       'https://placehold.co/600x600?text=Catnip+Kicker', 'Catnip Kicker Toy — high-fashion monochrome essentials for pets that thrive.', 50,
       '{"subtype":"kicker","color":"Black","rating":5}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'cat-catnip-kicker');
