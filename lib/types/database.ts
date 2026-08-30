export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: Agency
        Insert: Omit<Agency, 'id' | 'created_at'>
        Update: Partial<Omit<Agency, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Profile
        Update: Partial<Profile>
      }
      properties: {
        Row: Property
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'bhk'>
        Update: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at' | 'bhk'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>
      }
      matches: {
        Row: Match
        Insert: Omit<Match, 'id' | 'matched_at'>
        Update: Partial<Omit<Match, 'id' | 'matched_at'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
      }
      property_bookings: {
        Row: PropertyBooking
        Insert: Omit<PropertyBooking, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PropertyBooking, 'id' | 'created_at' | 'updated_at'>>
      }
      brokers: {
        Row: Broker
        Insert: Omit<Broker, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Broker, 'id' | 'created_at' | 'updated_at'>>
      }
      broker_property_relations: {
        Row: BrokerPropertyRelation
        Insert: Omit<BrokerPropertyRelation, 'id' | 'created_at'>
        Update: Partial<Omit<BrokerPropertyRelation, 'id' | 'created_at'>>
      }
      builders: {
        Row: Builder
        Insert: Omit<Builder, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Builder, 'id' | 'created_at' | 'updated_at'>>
      }
      schemes: {
        Row: Scheme
        Insert: Omit<Scheme, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Scheme, 'id' | 'created_at' | 'updated_at'>>
      }
      units: {
        Row: Unit
        Insert: Omit<Unit, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Unit, 'id' | 'created_at' | 'updated_at'>>
      }
      associate_applications: {
        Row: AssociateApplication
        Insert: Omit<AssociateApplication, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AssociateApplication, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      my_agency_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      broker_type: 'freelance' | 'agency' | 'other'
    }
  }
}

export type UserRole = 'admin' | 'agent' | 'viewer'
export type PropertyType = 'apartment' | 'flat' | 'floor' | 'villa' | 'independent_house' | 'kothi' | 'plot' | 'commercial' | 'farmhouse' | 'penthouse' | 'farmer_land'
export type PropertyStatus = 'available' | 'hold' | 'booked' | 'reserved' | 'sold' | 'rented'
export type BookingType = 'hold' | 'booked'
export type BookingStatus = 'active' | 'released' | 'converted' | 'cancelled' | 'cancel_requested'
export type ClientStatus = 'active' | 'matched' | 'closed'
export type MatchStatus = 'new' | 'reviewed' | 'contacted' | 'dismissed'
export type SaasLeadStatus = 'New' | 'Demo Sent' | 'Trial Started' | 'Converted' | 'Dormant' | 'OLD'
export type FurnishingType = 'unfurnished' | 'semi_furnished' | 'fully_furnished'
export type ClientSource = 'walk_in' | 'referral' | 'social_media' | 'property_portal' | 'cold_call' | 'other'
export type NotificationType = 'new_client' | 'match_found' | 'property_update' | 'team_member' | 'system'

export interface Agency {
  id: string
  name: string
  logo_url: string | null
  website: string | null
  address: string | null
  contact_phone: string | null
  contact_email: string | null
  rera_number: string | null
  facebook_url?: string | null
  instagram_url?: string | null
  linkedin_url?: string | null
  twitter_url?: string | null
  subscription_status: 'trial' | 'active' | 'paused' | 'expired'
  subscription_end_date: string | null
  max_users: number
  subscription_start_date: string | null
  plan_type: 'free' | 'monthly' | 'yearly'
  created_at: string
}

export interface Profile {
  id: string
  agency_id: string | null
  full_name: string
  email: string
  phone: string | null
  designation: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  is_super_admin: boolean
  rera_number: string | null
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  agency_id: string
  created_by: string | null
  title: string
  description: string | null
  property_type: PropertyType
  status: PropertyStatus
  price: number
  price_negotiable: boolean
  maintenance_charge: number | null
  address: string | null
  city: string | null
  locality: string | null
  pincode: string | null
  bhk: number[]
  bedrooms: number
  bathrooms: number
  area_sqft: number | null
  area_unit: 'sqft' | 'sqyard' | 'sqm' | 'gaj' | 'bigha'
  dimensions: string | null
  commercial_type: 'shop' | 'space' | 'land' | null
  road_info: string | null
  floor_number: string | null
  total_floors: string | null
  facing: string | null
  furnishing: FurnishingType | null
  parking: string | null
  image_urls: string[]
  cover_image_url: string | null
  is_deleted: boolean
  seller_name: string | null
  seller_phone: string | null
  approval_type: string | null
  group: string | null
  contact_type: 'client' | 'broker' | 'coloniser' | 'builder' | null
  slug: string | null
  listing_type: 'sale' | 'rent' | 'lease'
  is_featured: boolean
  is_new: boolean
  amenities: string[]
  balconies: number | null
  google_maps_url: string | null
  video_url: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  agency_id: string
  created_by: string | null
  assigned_to: string | null
  full_name: string
  phone: string
  email: string | null
  source: ClientSource | null
  notes: string | null
  status: ClientStatus
  priority: 'low' | 'medium' | 'high'
  follow_up_date: string | null
  follow_up_reason: string | null
  looking_for: 'buy' | 'rent' | 'sell' | 'rent_owner' | 'lease' | null
  property_types: PropertyType[]
  preferred_bhks: number[]
  preferred_locations: string[]
  budget_min: number | null
  budget_max: number | null
  min_bedrooms: number
  min_area_sqft: number | null
  min_area_unit: 'sqft' | 'sqyard' | 'sqm' | 'gaj' | 'bigha'
  min_dimensions: string | null
  preferred_commercial_type: 'shop' | 'space' | 'land' | null
  furnishing_preference: string | null
  possession_timeline: string | null
  contact_type: 'client' | 'broker' | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  // External Form & UTM Fields
  whatsapp_number: string | null
  purpose: string | null
  ready_for_site_visit: string | null
  preferred_call_time: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  campaign_name: string | null
  page_enquired: string | null
  lead_score: number | null
  assigned_at: string | null
}

export interface Match {
  id: string
  agency_id: string
  client_id: string
  property_id: string
  score: number
  score_breakdown: Json
  status: MatchStatus
  matched_at: string
}

export interface Notification {
  id: string
  agency_id: string
  user_id: string | null
  type: NotificationType
  title: string
  message: string
  reference_id: string | null
  reference_type: string | null
  is_read: boolean
  created_at: string
}

// Composite/Joined Types
export type MatchWithDetails = Match & {
  client: Client
  property: Property
}

export type PropertyWithCreator = Property & {
  creator: Profile | null
}

export type ClientWithAssignee = Client & {
  assignee: Profile | null
}

export interface Broker {
  id: string
  agency_id: string
  created_by: string | null
  full_name: string
  phones: string[]
  email: string | null
  company_name: string | null
  broker_type: 'freelance' | 'agency' | 'other'
  rating: number
  area: string | null
  specialties: string[]
  notes: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface BrokerPropertyRelation {
  id: string
  agency_id: string
  broker_id: string
  property_id: string
  relation_type: 'sourced' | 'shared'
  notes: string | null
  created_at: string
}

export interface SaasLead {
  id: string
  agency_name: string
  contact_name: string
  phone: string | null
  email: string | null
  city: string | null
  status: SaasLeadStatus
  source: string | null
  interest_level: string | null
  trial_password: string | null
  event_scheduled: boolean
  called_for_meeting: boolean
  attended_meeting: boolean
  review_requested: boolean
  follow_up_date: string | null
  notes: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface AssociateApplication {
  id: string
  agency_id: string
  full_name: string
  mobile_number: string
  whatsapp_number: string | null
  email: string | null
  city: string | null
  experience_level: string | null
  property_types: string[] | null
  preferred_working_location: string | null
  current_occupation: string | null
  works_with_other_company: boolean
  deals_closed_last_year: string | null
  status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface BrokerClientRelation {
  id: string
  agency_id: string
  broker_id: string
  client_id: string
  relation_type: 'sourced' | 'shared'
  notes: string | null
  created_at: string
}

export interface PropertyBooking {
  id: string
  agency_id: string
  property_id: string | null
  unit_id: string | null
  agent_id: string
  agent_name: string
  agent_phone: string | null
  agent_rera: string | null
  customer_name: string
  customer_phone: string | null
  customer_aadhaar: string | null
  client_id: string | null
  booking_type: BookingType
  status: BookingStatus
  hold_expires_at: string | null
  notes: string | null
  amount: number | null
  created_at: string
  updated_at: string
}

export type BookingWithDetails = PropertyBooking & {
  property: Pick<Property, 'id' | 'title' | 'locality' | 'city' | 'price' | 'property_type' | 'cover_image_url' | 'status'> | null
  agent: Pick<Profile, 'id' | 'full_name' | 'phone' | 'avatar_url'>
  unit?: (Pick<Unit, 'id' | 'unit_number' | 'status'> & {
    scheme: Pick<Scheme, 'id' | 'name' | 'location_details'>
  }) | null
}

export interface Builder {
  id: string
  agency_id: string
  name: string
  logo_url: string | null
  description: string | null
  city: string
  created_at: string
  updated_at: string
}

export interface Scheme {
  id: string
  builder_id: string
  agency_id: string
  name: string
  description: string | null
  location_details: string | null
  map_image_url: string | null
  total_units: number
  video_url: string | null
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  scheme_id: string
  agency_id: string
  unit_number: string
  unit_type: 'plot' | 'shop' | 'villa' | 'apartment'
  dimensions: string | null
  area_sqyd: number | null
  facing: string | null
  rate_per_sqyd: number | null
  plc: string | null
  status: 'available' | 'hold' | 'booked' | 'sold'
  details: Json
  created_at: string
  updated_at: string
}

export type UnitWithDetails = Unit & {
  scheme: Scheme
  builder: Builder
}
