-- ============================================
-- Rookies - Invoice Fields
-- ============================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS invoice_created_at TIMESTAMPTZ;
