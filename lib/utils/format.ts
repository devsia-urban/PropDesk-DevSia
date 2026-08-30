export function formatPrice(amount: number | null | undefined): string {
  if (!amount && amount !== 0) return ""

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)}k`
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatCurrency = formatPrice

export function formatBudget(amount: number | null | undefined): string {
  if (!amount && amount !== 0) return "0"
  return formatPrice(amount)
}

export function formatBudgetRange(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) return "Any Budget"
  if (!min) return `Up to ${formatBudget(max)}`
  if (!max) return `${formatBudget(min)}+`
  return `${formatBudget(min)} – ${formatBudget(max)}`
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
}

export function formatInitials(name: string): string {
  if (!name) return ""
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

export function formatBhk(bhk: number[] | number | null | undefined): string {
  if (!bhk) return "N/A"
  if (Array.isArray(bhk)) {
    if (bhk.length === 0) return "N/A"
    const sorted = [...bhk].sort((a, b) => a - b)
    if (sorted.length === 1) return `${sorted[0]} BHK`
    return `${sorted[0]}-${sorted[sorted.length - 1]} BHK`
  }
  return `${bhk} BHK`
}

export function generateWhatsAppMessage(params: {
  agencyName: string
  clientName: string
  propertyTitle: string
  propertyType: string
  locality: string
  score: number
  price: number
  link: string
  template?: string | null
}): string {
  const { agencyName, clientName, propertyTitle, propertyType, locality, score, price, link, template } = params

  const defaultTemplate =
    `Greetings {{client_name}}! 🏠\n\n` +
    `*{{property_title}}*\n` +
    `📍 {{locality}}\n` +
    `💰 {{price}}\n\n` +
    `View details here: {{link}}\n\n` +
    `Let me know if you would like to schedule a site visit!`

  let message = template || defaultTemplate

  // Replace placeholders
  const replacements: Record<string, string> = {
    '{{agency_name}}': agencyName,
    '{{client_name}}': clientName,
    '{{property_title}}': propertyTitle,
    '{{property_type}}': propertyType,
    '{{locality}}': locality,
    '{{score}}': score.toString(),
    '{{price}}': formatPrice(price),
    '{{link}}': link
  }

  Object.entries(replacements).forEach(([key, value]) => {
    // Escape special characters in key for RegExp
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    message = message.replace(new RegExp(escapedKey, 'g'), value || '')
  })

  // 🚀 PERFECT UNIVERSAL FORMATTING:
  // 1. Replace literal '\n' or '\\n' strings (common from DB) with real newline characters
  // 2. Clean up any trailing/leading whitespace from the whole message
  // 3. Ensure we use encodeURIComponent only after all string manipulations
  const finalMessage = message
    .replace(/\\n/g, '\n') // Handle both \n and \\n
    .replace(/\r/g, '')     // Remove carriage returns
    .trim()

  return encodeURIComponent(finalMessage)
}

