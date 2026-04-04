-- ─── Ops Canvas Workflows ───
CREATE TABLE ops_canvas_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_uid TEXT NOT NULL,
  name TEXT NOT NULL,
  template TEXT DEFAULT 'small',
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ops_canvas_workflows_owner ON ops_canvas_workflows(owner_uid);

-- ─── Review Tickets ───
CREATE TABLE review_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_uid TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL,
  confidence INTEGER DEFAULT 0,
  preview TEXT NOT NULL,
  message TEXT NOT NULL,
  ai_draft TEXT NOT NULL,
  sentiment TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'needs-review',
  received_at TIMESTAMPTZ DEFAULT now(),
  ai_category TEXT NOT NULL,
  context_used JSONB DEFAULT '[]'::jsonb,
  response_time_minutes DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_review_tickets_owner ON review_tickets(owner_uid);
CREATE INDEX idx_review_tickets_status ON review_tickets(status);
CREATE INDEX idx_review_tickets_created ON review_tickets(created_at);

-- ─── Updated At Triggers ───
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ops_canvas_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON review_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
