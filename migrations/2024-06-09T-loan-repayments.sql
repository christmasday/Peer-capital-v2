CREATE TABLE IF NOT EXISTS loan_repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_request_id UUID NOT NULL REFERENCES loan_requests(id),
  lender_id UUID NOT NULL REFERENCES profiles(id),
  borrower_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reminded, overdue, paid, defaulted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 