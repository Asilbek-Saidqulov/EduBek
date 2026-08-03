export interface ReviewDto { id: string; listingId: string; buyerId: string; purchaseId: string; rating: number; title: string | null; body: string | null; createdAt: string; updatedAt: string }
export interface WishlistDto { id: string; userId: string; listingId: string; createdAt: string }
export interface RecommendationDto { listingId: string; title: string; reason: string; score: number }
