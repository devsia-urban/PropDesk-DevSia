-- Create Helper Function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Enum for Broker Types (Safe creation)
DO $$ BEGIN
    CREATE TYPE public.broker_type AS ENUM ('freelance', 'agency' , 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Brokers Table
CREATE TABLE IF NOT EXISTS public.brokers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phones TEXT[] NOT NULL DEFAULT '{}',
    email TEXT,
    company_name TEXT,
    broker_type public.broker_type DEFAULT 'freelance',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) DEFAULT 3,
    area TEXT, -- Operating area
    specialties TEXT[] DEFAULT '{}', -- ['Plots', 'Luxury', etc.]
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Broker-Property Relations Table (Track Sourcing/Sharing)
CREATE TABLE IF NOT EXISTS public.broker_property_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('sourced', 'shared')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_property_relations ENABLE ROW LEVEL SECURITY;

-- Policies for Brokers
CREATE POLICY "Users can view brokers in their agency"
    ON public.brokers FOR SELECT
    USING (agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert brokers in their agency"
    ON public.brokers FOR INSERT
    WITH CHECK (agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update brokers in their agency"
    ON public.brokers FOR UPDATE
    USING (agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for Relations
CREATE POLICY "Users can view broker relations in their agency"
    ON public.broker_property_relations FOR SELECT
    USING (agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert broker relations in their agency"
    ON public.broker_property_relations FOR INSERT
    WITH CHECK (agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER set_brokers_updated_at
    BEFORE UPDATE ON public.brokers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add index for performance
CREATE INDEX idx_brokers_agency_id ON public.brokers(agency_id);
CREATE INDEX idx_broker_property_relations_broker_id ON public.broker_property_relations(broker_id);
CREATE INDEX idx_broker_property_relations_property_id ON public.broker_property_relations(property_id);
