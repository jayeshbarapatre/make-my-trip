export const brand = {
  name: process.env.BRAND_NAME || 'TripOra',
  tagline: process.env.BRAND_TAGLINE || 'India\'s Travel Partner',
  logoUrl: process.env.BRAND_LOGO_URL || '',
  primary: '#003580',
  accent: '#e63946',
  cta: '#1a73e8',
  success: '#0f9d58',
  ink: '#1f2937',
  muted: '#6b7280',
  line: '#e5e7eb',
  wash: '#f6f8fb',
  get appUrl () {
    return process.env.APP_BASE_URL || 'http://localhost:5173'
  },
  get supportEmail () {
    return process.env.SUPPORT_EMAIL || 'support@tripora.com'
  },
  get supportPhone () {
    return process.env.SUPPORT_PHONE || '+91 1800 102 8747'
  }
}

export default brand
