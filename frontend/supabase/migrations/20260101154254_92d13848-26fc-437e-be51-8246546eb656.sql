-- Rename cashback_percent to cash_allotment
ALTER TABLE campaigns RENAME COLUMN cashback_percent TO cash_allotment;

-- Add comment to clarify the column meaning
COMMENT ON COLUMN campaigns.cash_allotment IS 'Fixed cash allotment amount in rupees';

-- Convert existing percentage values to reasonable rupee amounts (e.g., 20% becomes ₹200)
UPDATE campaigns SET cash_allotment = cash_allotment * 10;