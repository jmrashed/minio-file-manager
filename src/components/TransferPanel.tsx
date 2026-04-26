import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { startUploadRequest } from '../hooks/useUpload'
import { useAppStore } from '../store/appStore'
import { formatFileSize } from '../utils/formatters'

const TransferPanel = () => {
  const queryClient = useQueryClient()
  const uploadQueue = useAppStore((state) => state.uploadQueue)
  const downloadProgress = useAppStore((state) => state.downloadProgress)
  const updateUploadItem = useAppStore((state) => state.updateUploadItem)
  const pauseUpload = useAppStore((state) => state.pauseUpload)
  const resumeUpload = useAppStore((state) => state.resumeUpload)
  const removeUploadItem = useAppStore((state) => state.removeUploadItem)
  const clearCompletedUploads = useAppStore((state) => state.clearCompletedUploads)
  const removeDownloadProgress = useAppStore((state) => state.removeDownloadProgress)

  useEffect(() => {
    const nextPending = uploadQueue.find((item) => item.status === 'pending' && !item.xhr)

    if (!nextPending) return

    let cancelled = false

    startUploadRequest(nextPending, (updates) => {
      if (cancelled) return
      updateUploadItem(nextPending.id, updates)
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['files', nextPending.bucket] })
      })
      .catch(() => {
        // Per-item error state is already handled by startUploadRequest.
      })

    return () => {
      cancelled = true
    }
  }, [queryClient, updateUploadItem, uploadQueue])

  const downloadItems = Object.values(downloadProgress)
  const hasTransfers = uploadQueue.length > 0 || downloadItems.length > 0

  if (!hasTransfers) return null

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/90">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Transfers
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Uploads continue in the background while you keep browsing.
          </p>
        </div>
        {uploadQueue.length > 0 && (
          <button
            onClick={clearCompletedUploads}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Clear finished uploads
          </button>
        )}
      </div>

      <div className="space-y-3">
        {uploadQueue.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-gray-200 px-3 py-3 dark:border-gray-700"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {item.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.status} · {formatFileSize(item.uploadedBytes)} / {formatFileSize(item.totalBytes)}
                </p>
                {item.error && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {item.error}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                {item.status === 'uploading' && (
                  <button
                    onClick={() => pauseUpload(item.id)}
                    className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
                    title="Pause upload"
                  >
                    <PauseIcon className="h-4 w-4" />
                  </button>
                )}
                {item.status === 'paused' && (
                  <button
                    onClick={() => resumeUpload(item.id)}
                    className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
                    title="Resume upload"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                )}
                {(item.status === 'completed' || item.status === 'error') && (
                  <button
                    onClick={() => removeUploadItem(item.id)}
                    className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
                    title="Remove upload"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
                {item.status === 'pending' && (
                  <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full rounded-full transition-all ${
                  item.status === 'error'
                    ? 'bg-red-500'
                    : item.status === 'completed'
                      ? 'bg-emerald-500'
                      : 'bg-primary-500'
                }`}
                style={{ width: `${item.progress}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{item.progress}%</span>
              <span>{item.speed > 0 ? `${formatFileSize(item.speed)}/s` : '--'}</span>
            </div>
          </div>
        ))}

        {downloadItems.map((item) => (
          <div
            key={item.key}
            className="rounded-lg border border-gray-200 px-3 py-3 dark:border-gray-700"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.status} · {formatFileSize(item.downloadedBytes)} / {item.totalBytes > 0 ? formatFileSize(item.totalBytes) : 'unknown'}
                </p>
              </div>
              {item.status !== 'downloading' && (
                <button
                  onClick={() => removeDownloadProgress(item.key)}
                  className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
                  title="Dismiss download"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full rounded-full transition-all ${
                  item.status === 'error'
                    ? 'bg-red-500'
                    : item.status === 'completed'
                      ? 'bg-emerald-500'
                      : 'bg-secondary-500'
                }`}
                style={{ width: `${item.progress}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{item.progress}%</span>
              <span>{item.speed > 0 ? `${formatFileSize(item.speed)}/s` : '--'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TransferPanel
