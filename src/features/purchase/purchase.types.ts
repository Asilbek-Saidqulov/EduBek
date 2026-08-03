export interface PurchaseDto { id: string; buyerId: string; listingId: string; creatorId: string; resourceId: string; pricePaid: number; platformFee: number; creatorEarning: number; status: string; refundableUntil: string | null; refundedAt: string | null; createdAt: string }
export interface PurchaseResultDto extends PurchaseDto { resourceTitle: string; resourceType: string; message: string }
