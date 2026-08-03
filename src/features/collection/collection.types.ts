export interface CollectionItemDto { id: string; resourceId: string; resourceTitle: string; resourceType: string; sortOrder: number; addedAt: string }
export interface CollectionDto { id: string; ownerId: string; orgId: string | null; name: string; description: string | null; itemCount: number; createdAt: string; updatedAt: string }
export interface CollectionWithItemsDto extends CollectionDto { items: CollectionItemDto[] }
