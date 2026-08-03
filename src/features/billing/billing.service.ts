import { PLATFORM_CONFIG } from '@/config/platform'
export function calculatePriceBreakdown(price: number) { const fee = Math.floor(price * (PLATFORM_CONFIG.MARKETPLACE_PLATFORM_FEE_PERCENT / 100)); return { price, platformFee: fee, creatorEarning: price - fee } }
export function calculateRefund(pricePaid: number) { return pricePaid }
