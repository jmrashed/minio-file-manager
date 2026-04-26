import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface AppState {
  selectedFiles: string[]
  viewMode: 'list' | 'grid'
  setSelectedFiles: (files: string[]) => void
  toggleFileSelection: (file: string) => void
  clearSelection: () => void
  setViewMode: (mode: 'list' | 'grid') => void
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      selectedFiles: [],
      viewMode: 'grid',

      setSelectedFiles: (files) => set({ selectedFiles: files }),

      toggleFileSelection: (file) =>
        set((state) => ({
          selectedFiles: state.selectedFiles.includes(file)
            ? state.selectedFiles.filter(f => f !== file)
            : [...state.selectedFiles, file],
        })),

      clearSelection: () => set({ selectedFiles: [] }),

      setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: 'app-store',
    }
  )
)