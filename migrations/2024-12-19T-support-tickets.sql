-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  ip_address INET
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);

-- Create support_ticket_responses table for ticket conversations
CREATE TABLE IF NOT EXISTS support_ticket_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_staff_response BOOLEAN DEFAULT false,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ticket responses
CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_ticket_id ON support_ticket_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_created_at ON support_ticket_responses(created_at);

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
-- Users can view their own tickets
CREATE POLICY "Users can view own support tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create tickets
CREATE POLICY "Users can create support tickets" ON support_tickets
  FOR INSERT WITH CHECK (true);

-- Users can update their own tickets
CREATE POLICY "Users can update own support tickets" ON support_tickets
  FOR UPDATE USING (auth.uid() = user_id);

-- Staff can view all tickets (using user_roles table)
CREATE POLICY "Staff can view all support tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role_type IN ('admin', 'support')
    )
  );

-- RLS Policies for support_ticket_responses
-- Users can view responses to their tickets
CREATE POLICY "Users can view responses to own tickets" ON support_ticket_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_ticket_responses.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Users can create responses to their tickets
CREATE POLICY "Users can create responses to own tickets" ON support_ticket_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_ticket_responses.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Staff can view and create responses to all tickets
CREATE POLICY "Staff can manage all ticket responses" ON support_ticket_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role_type IN ('admin', 'support')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_support_ticket_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

CREATE TRIGGER update_support_ticket_responses_updated_at
  BEFORE UPDATE ON support_ticket_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_responses_updated_at();
