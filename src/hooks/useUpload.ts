import { getPresignedUploadUrl } from '../services/fileService'
import { generateUploadId, useAppStore, UploadQueueItem } from '../store/appStore'

interface QueueUploadParams {
  bucket: string
  files: File[]
  path?: string
}

export const useUpload = () => {
  const addToUploadQueue = useAppStore((state) => state.addToUploadQueue)

  const queueUploads = ({ bucket, files, path = '' }: QueueUploadParams) => {
    const items: UploadQueueItem[] = files.map((file) => {
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
      const key = path ? `${path}${relativePath}` : relativePath

      return {
        id: generateUploadId(),
        bucket,
        file,
        key,
        progress: 0,
        status: 'pending',
        speed: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        xhr: null,
      }
    })

    addToUploadQueue(items)
    return items.length
  }

  return {
    queueUploads,
  }
}

export const startUploadRequest = async (
  item: UploadQueueItem,
  onProgress: (updates: Partial<UploadQueueItem>) => void
): Promise<void> => {
  const url = await getPresignedUploadUrl(item.bucket, item.key)

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const startedAt = Date.now()

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return

      const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.1)
      const uploadedBytes = event.loaded
      onProgress({
        uploadedBytes,
        totalBytes: event.total,
        progress: Math.round((uploadedBytes / Math.max(event.total, 1)) * 100),
        speed: uploadedBytes / elapsedSeconds,
      })
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress({
          xhr: null,
          progress: 100,
          uploadedBytes: item.file.size,
          totalBytes: item.file.size,
          speed: 0,
          status: 'completed',
        })
        resolve()
        return
      }

      onProgress({
        xhr: null,
        status: 'error',
        speed: 0,
        error: `Upload failed with status ${xhr.status}`,
      })
      reject(new Error(`Upload failed with status ${xhr.status}`))
    })

    xhr.addEventListener('error', () => {
      onProgress({
        xhr: null,
        status: 'error',
        speed: 0,
        error: 'Network error during upload',
      })
      reject(new Error('Network error during upload'))
    })

    xhr.addEventListener('abort', () => {
      const currentItem = useAppStore.getState().uploadQueue.find((queueItem) => queueItem.id === item.id)

      if (currentItem?.status === 'paused') {
        onProgress({
          xhr: null,
          speed: 0,
        })
        resolve()
        return
      }

      onProgress({
        xhr: null,
        status: 'error',
        speed: 0,
        error: 'Upload was cancelled',
      })
      reject(new Error('Upload was cancelled'))
    })

    xhr.open('PUT', url)

    if (item.file.type) {
      xhr.setRequestHeader('Content-Type', item.file.type)
    }

    onProgress({
      xhr,
      status: 'uploading',
      error: undefined,
      speed: 0,
    })

    xhr.send(item.file)
  })
}
