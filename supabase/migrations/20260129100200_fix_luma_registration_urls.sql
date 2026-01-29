-- Fix Luma events that have bare slugs instead of full URLs
-- in registration_url and source_url fields

UPDATE aggregated_events
SET registration_url = 'https://lu.ma/' || registration_url
WHERE source = 'luma'
  AND registration_url != ''
  AND registration_url NOT LIKE 'http%';

UPDATE aggregated_events
SET source_url = 'https://lu.ma/' || source_url
WHERE source = 'luma'
  AND source_url != ''
  AND source_url NOT LIKE 'http%';
