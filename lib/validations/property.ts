import * as z from "zod"

export const propertyStatusValues = ["available", "reserved", "sold", "rented", "hold", "booked"] as const
export const propertyTypeValues = ["apartment", "flat", "floor", "villa", "independent_house", "kothi", "plot", "commercial", "farmhouse", "penthouse", "farmer_land"] as const
export const furnishingValues = ["unfurnished", "semi_furnished", "fully_furnished"] as const
export const listingTypeValues = ["sale", "rent", "lease"] as const

export const PropertyFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  property_type: z.enum(propertyTypeValues),
  status: z.enum(propertyStatusValues),
  listing_type: z.enum(listingTypeValues).default("sale"),
  price: z.number().min(1, "Price is required"),
  price_negotiable: z.boolean().optional(),
  locality: z.string().min(1, "Locality is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  bhk: z.array(z.number()).default([]),
  bedrooms: z.number().min(0).optional().nullable(),
  bathrooms: z.number().min(0).optional().nullable(),
  area_sqft: z.number().optional().nullable(),
  area_unit: z.enum(["sqft", "sqyard", "sqm", "gaj", "bigha"]).optional().nullable(),
  dimensions: z.string().optional().nullable(),
  commercial_type: z.enum(["shop", "space", "land"]).optional().nullable(),
  road_info: z.string().optional().nullable(),
  furnishing: z.enum(furnishingValues).optional().nullable(),
  floor_number: z.string().optional().nullable(),
  total_floors: z.string().optional().nullable(),
  facing: z.string().optional().nullable(),
  parking: z.string().optional().nullable(),
  maintenance_charge: z.number().min(0).optional().nullable(),
  cover_image_url: z.string().optional().nullable(),
  image_urls: z.array(z.string()).max(5, "Maximum 5 images allowed").optional().default([]),
  // New fields
  seller_name: z.string().optional().nullable(),
  seller_phone: z.string().optional().nullable(),
  approval_type: z.string().optional().nullable(),
  group: z.string().optional().nullable(),
  contact_type: z.enum(["client", "broker", "coloniser", "builder"]).optional().nullable(),
  // Slug: auto-generated from title. Only lowercase letters, numbers, hyphens.
  // No spaces, no leading/trailing hyphens. Server validates uniqueness.
  slug: z.string()
    .optional()
    .nullable()
    .transform(val => {
      if (!val) return val
      return val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
    })
    .refine(val => !val || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(val), {
      message: 'Slug must be lowercase letters, numbers and hyphens only (e.g. luxury-flat-jaipur)'
    }),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(true),
  amenities: z.array(z.string()).default([]),
  balconies: z.number().min(0).optional().nullable(),
  google_maps_url: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  video_url: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  source_broker_id: z.string().optional().nullable(),
  seller_client_id: z.string().optional().nullable(),
})

export type PropertyFormValues = z.infer<typeof PropertyFormSchema>

export type PropertyFilters = {
  search?: string
  property_type?: string
  status?: string
  listing_type?: string
  approval_type?: string
  bhk?: string | number[]
  price_min?: number
  price_max?: number
  page?: number
}
