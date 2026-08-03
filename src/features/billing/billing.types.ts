export interface PriceBreakdown { price: number; platformFeePercent: number; platformFee: number; creatorEarning: number; currency: string }
export interface RefundEligibility { eligible: boolean; reason?: string; refundAmount: number }
