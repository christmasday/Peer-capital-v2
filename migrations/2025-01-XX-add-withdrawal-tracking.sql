-- Add withdrawal transaction tracking to loan_requests
ALTER TABLE loan_requests
ADD COLUMN IF NOT EXISTS disbursement_tx_id TEXT,
ADD COLUMN IF NOT EXISTS disbursement_correlation_id TEXT,
ADD COLUMN IF NOT EXISTS lender_fee_tx_id TEXT,
ADD COLUMN IF NOT EXISTS borrower_fee_tx_id TEXT;

-- Add withdrawal transaction tracking to loan_repayments
ALTER TABLE loan_repayments
ADD COLUMN IF NOT EXISTS repayment_tx_id TEXT,
ADD COLUMN IF NOT EXISTS repayment_correlation_id TEXT;

-- Index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_loan_requests_disbursement_tx ON loan_requests(disbursement_tx_id);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_tx ON loan_repayments(repayment_tx_id);
