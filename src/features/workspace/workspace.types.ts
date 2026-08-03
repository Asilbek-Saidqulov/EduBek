export interface WorkspaceDashboardDto {
  recentResources: Array<{ id: string; title: string; resourceType: string; status: string; updatedAt: string }>
  draftCount: number; readyCount: number; archivedCount: number
  favorites: Array<{ id: string; title: string; resourceType: string; updatedAt: string }>
  recentlyEdited: Array<{ id: string; title: string; resourceType: string; updatedAt: string }>
  orgResources: Array<{ id: string; title: string; resourceType: string; orgId: string | null; updatedAt: string }>
  personalResources: Array<{ id: string; title: string; resourceType: string; updatedAt: string }>
  collections: Array<{ id: string; name: string; itemCount: number; updatedAt: string }>
}
