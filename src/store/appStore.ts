import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface UploadQueueItem {
  id: string
  file: File
  key: string
  progress: number
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error'
  speed: number // bytes per second
  uploadedBytes: number
  totalBytes: number
  error?: string
  abortController?: AbortController
}

export interface DownloadProgress {
  key: string
  name: string
  progress: number
  status: 'downloading' | 'completed' | 'error'
  speed: number
  downloadedBytes: number
  totalBytes: number
}

export interface ClipboardItem {
  keys: string[]
  action: 'copy' | 'cut'
  sourceBucket: string
  sourcePath: string
}

interface AppState {
  // Selection
  selectedFiles: string[]
  setSelectedFiles: (files: string[]) => void
  toggleFileSelection: (file: string) => void
  clearSelection: () => void
  selectRange: (start: string, end: string, allFiles: string[]) => void

  // View
  viewMode: 'list' | 'grid'
  setViewMode: (mode: 'list' | 'grid') => void

  // Upload Queue
  uploadQueue: UploadQueueItem[]
  addToUploadQueue: (items: UploadQueueItem[]) => void
  updateUploadItem: (id: string, updates: Partial<UploadQueueItem>) => void
  removeUploadItem: (id: string) => void
  clearCompletedUploads: () => void
  pauseUpload: (id: string) => void
  resumeUpload: (id: string) => void

  // Download Progress
  downloadProgress: Record<string, DownloadProgress>
  setDownloadProgress: (key: string, progress: DownloadProgress) => void
  removeDownloadProgress: (key: string) => void

  // Clipboard
  clipboard: ClipboardItem | null
  setClipboard: (clipboard: ClipboardItem | null) => void

  // Context Menu
  contextMenu: {
    visible: boolean
    x: number
    y: number
    fileKey: string | null
  }
  showContextMenu: (x: number, y: number, fileKey: string | null) => void
  hideContextMenu: () => void

  // Settings
  showHidden: boolean
  setShowHidden: (show: boolean) => void
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
  setSort: (by: 'name' | 'date' | 'size' | 'type', order: 'asc' | 'desc') => void
  filterBy: string
  setFilterBy: (filter: string) => void
}

let uploadIdCounter = 0
export const generateUploadId = (): string => `upload-${++uploadIdCounter}-${Date.now()}`

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      selectedFiles: [],
      viewMode: 'grid',
      uploadQueue: [],
      downloadProgress: {},
      clipboard: null,
      contextMenu: { visible: false, x: 0, y: 0, fileKey: null },
      showHidden: false,
      sortBy: 'name',
      sortOrder: 'asc',
      filterBy: 'all',

      setSelectedFiles: (files) => set({ selectedFiles: files }),

      toggleFileSelection: (file) =>
        set((state) => ({
          selectedFiles: state.selectedFiles.includes(file)
            ? state.selectedFiles.filter((f) => f !== file)
            : [...state.selectedFiles, file],
        })),

      clearSelection: () => set({ selectedFiles: [] }),

      selectRange: (start, end, allFiles) =>
        set(() => {
          const startIdx = allFiles.indexOf(start)
          const endIdx = allFiles.indexOf(end)
          if (startIdx === -1 || endIdx === -1) return {}
          const [min, max] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
          const range = allFiles.slice(min, max + 1)
          return { selectedFiles: Array.from(new Set([...range])) }
        }),

      setViewMode: (viewMode) => set({ viewMode }),

      addToUploadQueue: (items) =>
        set((state) => ({ uploadQueue: [...state.uploadQueue, ...items] })),

      updateUploadItem: (id, updates) =>
        set((state) => ({
          uploadQueue: state.uploadQueue.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      removeUploadItem: (id) =>
        set((state) => ({
          uploadQueue: state.uploadQueue.filter((item) => item.id !== id),
        })),

      clearCompletedUploads: () =>
        set((state) => ({
          uploadQueue: state.uploadQueue.filter(
            (item) => item.status !== 'completed' && item.status !== 'error'
          ),
        })),

      pauseUpload: (id) =>
        set((state) => {
          const item = state.uploadQueue.find((i) => i.id === id)
          if (item?.abortController) {
            item.abortController.abort()
          }
          return {
            uploadQueue: state.uploadQueue.map((item) =>
              item.id === id ? { ...item, status: 'paused' as const } : item
            ),
          }
        }),

      resumeUpload: (id) =>
        set((state) => ({
          uploadQueue: state.uploadQueue.map((item) =>
            item.id === id ? { ...item, status: 'pending' as const } : item
          ),
        })),

      setDownloadProgress: (key, progress) =>
        set((state) => ({
          downloadProgress: { ...state.downloadProgress, [key]: progress },
        })),

      removeDownloadProgress: (key) =>
        set((state) => {
          const next = { ...state.downloadProgress }
          delete next[key]
          return { downloadProgress: next }
        }),

      setClipboard: (clipboard) => set({ clipboard }),

      showContextMenu: (x, y, fileKey) =>
        set({ contextMenu: { visible: true, x, y, fileKey } }),

      hideContextMenu: () =>
        set((state) => ({ contextMenu: { ...state.contextMenu, visible: false } })),

      setShowHidden: (showHidden) => set({ showHidden }),

      setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

      setFilterBy: (filterBy) => set({ filterBy }),
    }),
    { name: 'app-store' }
  )
)

