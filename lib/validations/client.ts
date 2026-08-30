import * as z from "zod"

export const ClientFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number is too short").max(13, "Phone number is too long"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  source: z.string().optional(),
  notes: z.string().optional(),
  looking_for: z.enum(["buy", "rent", "sell", "rent_owner", "lease"]).optional(),
  property_types: z.array(z.string()).min(1, 'Select at least one type'),
  preferred_locations: z.array(z.string()).min(1, 'Add at least one location'),
  preferred_bhks: z.array(z.number()),
  budget_min: z.number().nullable().optional(),
  budget_max: z.number().nullable().optional(),
  min_bedrooms: z.number().min(0).max(10).optional(),
  min_area_sqft: z.number().nullable().optional(),
  min_area_unit: z.enum(["sqft", "sqyard", "sqm", "gaj", "bigha"]).optional().nullable(),
  min_dimensions: z.string().optional().nullable(),
  preferred_commercial_type: z.enum(["shop", "space", "land"]).optional().nullable(),
  furnishing_preference: z.string().optional(),
  possession_timeline: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  follow_up_date: z.date().optional(),
  follow_up_reason: z.string().optional().nullable(),
  contact_type: z.enum(["client", "broker"]).optional().nullable(),
  assigned_to: z.string().optional(),
  whatsapp_number: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  ready_for_site_visit: z.string().optional().nullable(),
  preferred_call_time: z.string().optional().nullable(),
}).refine(data => {
  if (data.budget_min && data.budget_max) {
    return data.budget_max >= data.budget_min;
  }
  return true;
}, {
  message: "Maximum budget cannot be less than minimum budget",
  path: ["budget_max"]
})

export type ClientFormValues = z.infer<typeof ClientFormSchema>

export type ClientFilters = {
  search?: string
  budget_min?: number
  budget_max?: number
  property_types?: string[]
  status?: string
  page?: number
  assigned_to?: string
  looking_for?: string
}
