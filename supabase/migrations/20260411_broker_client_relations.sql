-- Create broker_client_relations table
CREATE TABLE IF NOT EXISTS public.broker_client_relations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('sourced', 'shared')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_broker_client_relations_broker_id ON public.broker_client_relations(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_client_relations_client_id ON public.broker_client_relations(client_id);
CREATE INDEX IF NOT EXISTS idx_broker_client_relations_agency_id ON public.broker_client_relations(agency_id);

-- Enable RLS
ALTER TABLE public.broker_client_relations ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (Standard agency-based isolation)
CREATE POLICY "Users can view broker client relations within their agency"
    ON public.broker_client_relations FOR SELECT
    USING (agency_id = public.my_agency_id());

CREATE POLICY "Users can insert broker client relations within their agency"
    ON public.broker_client_relations FOR INSERT
    WITH CHECK (agency_id = public.my_agency_id());

CREATE POLICY "Users can update broker client relations within their agency"
    ON public.broker_client_relations FOR UPDATE
    USING (agency_id = public.my_agency_id())
    WITH CHECK (agency_id = public.my_agency_id());

CREATE POLICY "Users can delete broker client relations within their agency"
    ON public.broker_client_relations FOR DELETE
    USING (agency_id = public.my_agency_id());

-- Add to Realtime replication if needed
-- ALTER PUBLICATION supabase_realtime ADD TABLE broker_client_relations;
