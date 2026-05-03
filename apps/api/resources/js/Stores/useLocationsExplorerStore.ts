import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationsExplorerState {
  recentViewedIds: number[];
  addRecentViewed: (locationId: number) => void;
  clearRecentViewed: () => void;
}

export const useLocationsExplorerStore = create<LocationsExplorerState>()(
  persist(
    (set) => ({
      recentViewedIds: [],
      addRecentViewed: (locationId: number) =>
        set((state) => ({
          recentViewedIds: [
            locationId,
            ...state.recentViewedIds.filter((id) => id !== locationId),
          ].slice(0, 6),
        })),
      clearRecentViewed: () => set({ recentViewedIds: [] }),
    }),
    {
      name: 'locations-explorer-store',
    },
  ),
);
