import { Client, Property } from '@/lib/types/database'

export interface MatchScoreBreakdown {
  budget: number     // 0–30
  location: number   // 0–10
  property_type: number // 0–40
  bedrooms: number   // 0–15 (0 for land/commercial)
  area: number       // 0–5 (20 for land/commercial)
  notes?: string[]   // Human readable explanations
}

export interface MatchScoreResult {
  score: number
  breakdown: MatchScoreBreakdown
  qualifies: boolean  // score >= 60
}

/**
 * Property Type Clusters for smart matching
 */
const CLUSTERS = {
  residential: ["apartment", "flat", "floor", "independent_house", "house", "villa", "kothi", "penthouse", "studio", "farmhouse"],
  land: ["plot", "farmer_land"],
  commercial: ["commercial", "shop", "office", "showroom", "commercial_land"],
}

function getCluster(type: string): string | null {
  for (const [cluster, types] of Object.entries(CLUSTERS)) {
    if (types.includes(type)) return cluster
  }
  return null
}

/**
 * Score how well a property matches a client's requirements.
 * Total: 100 pts. Qualifies if score >= 40.
 */
export function scoreMatch(client: Client, property: Property): MatchScoreResult {
  const notes: string[] = []

  // 0. Strict Listing Type Match (Sale vs Rent/Lease)
  if (client.looking_for) {
    const wantsSale = client.looking_for === "buy" || client.looking_for === "sell"
    const wantsRentLease = client.looking_for === "rent" || client.looking_for === "rent_owner" || client.looking_for === "lease"
    
    const isSale = property.listing_type === "sale"
    const isRentLease = property.listing_type === "rent" || property.listing_type === "lease"

    if ((wantsSale && !isSale) || (wantsRentLease && !isRentLease)) {
      return {
        score: 0,
        breakdown: { budget: 0, location: 0, property_type: 0, bedrooms: 0, area: 0, notes: ["Disqualified: Intent mismatch (Sale vs Rent)"] },
        qualifies: false
      }
    }
  }

  // 1. Property Type Cluster Match (30 pts)
  let property_type_score = 0
  if (client.property_types && client.property_types.length > 0) {
    if (client.property_types.includes(property.property_type)) {
      property_type_score = 30
      notes.push(`Exact match for ${property.property_type.replace('_', ' ')}`)
    } else {
      const propCluster = getCluster(property.property_type)
      const hasClusterMatch = client.property_types.some(t => getCluster(t) === propCluster)
      if (hasClusterMatch) {
        property_type_score = 15
        notes.push(`Alternative match: similar property type (${propCluster})`)
      } else {
        property_type_score = 0
        notes.push(`Mismatch: Looking for ${client.property_types.join(', ')}`)
      }
    }
  } else {
    property_type_score = 30
    notes.push("No specific property type requested")
  }

  // 2. Budget Scoring (30 pts)
  let budget_score = 0
  const minBudget = client.budget_min || 0
  const maxBudget = client.budget_max || Infinity
  
  if (minBudget === 0 && maxBudget === Infinity) {
    budget_score = 30
    notes.push("No budget constraints")
  } else {
    const price = property.price
    if (price >= minBudget && price <= maxBudget) {
      budget_score = 30
      notes.push("Perfectly within budget range")
    } else if (price < minBudget) {
      // Under budget penalty
      const diff = minBudget - price
      const diffPercent = diff / minBudget
      if (diffPercent <= 0.15) {
        budget_score = 25
        notes.push(`Slightly under budget (${Math.round(diffPercent*100)}% cheaper)`)
      } else if (diffPercent <= 0.30) {
        budget_score = 15
        notes.push(`Under budget (${Math.round(diffPercent*100)}% cheaper)`)
      } else {
        budget_score = 5
        notes.push("Significantly below budget range (might lack premium features)")
      }
    } else if (price > maxBudget) {
      // Over budget penalty
      const diff = price - maxBudget
      const diffPercent = diff / maxBudget
      if (diffPercent <= 0.10) {
        budget_score = 15
        notes.push(`Slightly over budget (${Math.round(diffPercent*100)}% higher)`)
      } else if (diffPercent <= 0.20) {
        budget_score = 5
        notes.push(`Over budget (${Math.round(diffPercent*100)}% higher)`)
      } else {
        budget_score = 0
        notes.push("Way over budget limit")
      }
    }
  }

  // 3. Location Match (20 pts)
  let location_score = 0
  if (!client.preferred_locations || client.preferred_locations.length === 0) {
    location_score = 20
    notes.push("No specific location requested")
  } else {
    const propLocations = [
      property.locality?.toLowerCase().trim() ?? '',
      property.city?.toLowerCase().trim() ?? '',
    ].filter(Boolean)
    
    let matchedName = ''
    const matched = client.preferred_locations.some(pref => {
      const p = pref.toLowerCase().trim()
      const isMatch = propLocations.some(loc => loc.includes(p) || p.includes(loc))
      if (isMatch) matchedName = pref
      return isMatch
    })
    
    if (matched) {
      location_score = 20
      notes.push(`Location matches: ${matchedName}`)
    } else {
      location_score = 0
      notes.push(`Outside of preferred locations`)
    }
  }

  // 4. Features: BHK & Area (20 pts total)
  let bhk_score = 0
  let area_score = 0
  
  const propCluster = getCluster(property.property_type)
  const isLandOrCommercial = propCluster === 'land' || propCluster === 'commercial'

  if (isLandOrCommercial) {
    // Area is everything (20 pts)
    bhk_score = 0
    if (!client.min_area_sqft) {
      area_score = 20
      notes.push("No area constraints")
    } else {
      const clientMinSqft = normalizeToSqft(client.min_area_sqft, client.min_area_unit)
      const propertySqft = property.area_sqft ? normalizeToSqft(property.area_sqft, property.area_unit) : null
      
      if (propertySqft != null) {
        if (propertySqft >= clientMinSqft) {
          area_score = 20
          notes.push("Meets area requirement")
        } else if (propertySqft >= clientMinSqft * 0.85) {
          area_score = 10
          notes.push("Slightly smaller than area requirement (<15% off)")
        } else {
          area_score = 0
          notes.push("Too small")
        }
      } else {
        area_score = 10 // Missing area data on property, give half points
      }
    }
  } else {
    // Residential: BHK (15 pts) + Area (5 pts)
    const hasPreferredBHKs = client.preferred_bhks && client.preferred_bhks.length > 0
    // @ts-ignore - Handle older property models that might have bhk array
    const propBHKConfigs: number[] = property.bhk && property.bhk.length > 0 ? property.bhk : [property.bedrooms]

    if (hasPreferredBHKs) {
      const matchesExactly = propBHKConfigs.some(b => client.preferred_bhks.includes(b))
      if (matchesExactly) {
        bhk_score = 15
        notes.push("Exact BHK match")
      } else {
        // Check if within +/- 1 BHK
        const closeMatch = propBHKConfigs.some(b => client.preferred_bhks.some(pref => Math.abs(b - pref) <= 1))
        if (closeMatch) {
          bhk_score = 7
          notes.push("Close BHK match (+/- 1 room)")
        } else {
          bhk_score = 0
          notes.push("BHK mismatch")
        }
      }
    } else if (client.min_bedrooms) {
      if (property.bedrooms >= client.min_bedrooms) {
        bhk_score = 15
        notes.push("Meets minimum bedrooms")
      } else if (property.bedrooms >= client.min_bedrooms - 1) {
        bhk_score = 7
        notes.push("Slightly below minimum bedrooms")
      } else {
        bhk_score = 0
      }
    } else {
      bhk_score = 15
      notes.push("No bedroom preference")
    }
    
    // Area (5 pts)
    if (!client.min_area_sqft) {
      area_score = 5
    } else {
      const clientMinSqft = normalizeToSqft(client.min_area_sqft, client.min_area_unit)
      const propertySqft = property.area_sqft ? normalizeToSqft(property.area_sqft, property.area_unit) : null
      
      if (propertySqft != null) {
        if (propertySqft >= clientMinSqft) {
          area_score = 5
          notes.push("Comfortable area space")
        } else if (propertySqft >= clientMinSqft * 0.85) {
          area_score = 2
        } else {
          area_score = 0
        }
      } else {
        area_score = 2 // Missing data
      }
    }
  }

  const totalScore = property_type_score + budget_score + location_score + bhk_score + area_score

  return {
    score: totalScore,
    breakdown: { 
      budget: budget_score, 
      location: location_score, 
      property_type: property_type_score, 
      bedrooms: bhk_score, 
      area: area_score,
      notes
    },
    qualifies: totalScore >= 50, // Raised qualification bar to 50
  }
}

function normalizeToSqft(val: any, unit: string = 'sqft'): number {
  const numVal = Number(val)
  if (isNaN(numVal)) return 0
  if (unit === 'sqyard') return numVal * 9
  if (unit === 'sqm') return numVal * 10.7639
  if (unit === 'gaj') return numVal * 9
  if (unit === 'bigha') return numVal * 27225
  return numVal
}
