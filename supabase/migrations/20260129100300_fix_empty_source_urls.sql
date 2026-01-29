-- Fix events with empty source_url by copying from registration_url
UPDATE aggregated_events
SET source_url = registration_url
WHERE (source_url IS NULL OR source_url = '')
  AND registration_url LIKE 'http%';
