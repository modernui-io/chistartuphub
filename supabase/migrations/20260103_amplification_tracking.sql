-- Add amplification tracking columns to founder_asks
ALTER TABLE founder_asks
ADD COLUMN IF NOT EXISTS amplified_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS amplification_notified_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for querying pending amplifications
CREATE INDEX IF NOT EXISTS idx_founder_asks_amplification
ON founder_asks(allow_amplification, amplified_at)
WHERE allow_amplification = true;

-- Comment for clarity
COMMENT ON COLUMN founder_asks.amplified_at IS 'Timestamp when admin marked this ask as amplified';
COMMENT ON COLUMN founder_asks.amplification_notified_at IS 'Timestamp when founder was notified about amplification';
