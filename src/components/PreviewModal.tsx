import { useState, useEffect } from 'react'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import {
  FileObject,
  downloadFileWithProgress,
  fetchTextFileContent,
  getPresignedDownloadUrl,
} from '../services/fileService'
import {
  isAudioFile,
  isImageFile,
  isPdfFile,
  isTextFile,
  isVideoFile,
  formatFileSize,
  formatDateTime,
} from '../utils/formatters'
import { useAppStore } from '../store/appStore'

interface PreviewModalProps {
  file: FileObject | null
  bucket: string
  onClose: () => void
}

const PreviewModal = ({ file, bucket, onClose }: PreviewModalProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setDownloadProgress = useAppStore((state) => state.setDownloadProgress)

  useEffect(() => {
    if (!file) return

    const loadPreview = async () => {
      setLoading(true)
      setError(null)
      setTextContent(null)

      try {
        if (isTextFile(file.name)) {
          const content = await fetchTextFileContent(bucket, file.key)
          setTextContent(content)
          setPreviewUrl(null)
        } else {
          const url = await getPresignedDownloadUrl(bucket, file.key)
          setPreviewUrl(url)
        }
      } catch (err) {
        setError('Failed to load preview')
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [bucket, file])

  if (!file) return null

  const handleDownload = async () => {
    try {
      setDownloadProgress(file.key, {
        key: file.key,
        name: file.name,
        progress: 0,
        status: 'downloading',
        speed: 0,
        downloadedBytes: 0,
        totalBytes: 0,
      })

      await downloadFileWithProgress(bucket, file.key, file.name, (progress) => {
        setDownloadProgress(file.key, {
          key: file.key,
          name: file.name,
          progress: progress.progress,
          status: 'downloading',
          speed: progress.speed,
          downloadedBytes: progress.loaded,
          totalBytes: progress.total,
        })
      })

      setDownloadProgress(file.key, {
        key: file.key,
        name: file.name,
        progress: 100,
        status: 'completed',
        speed: 0,
        downloadedBytes: file.size,
        totalBytes: file.size,
      })
    } catch (error) {
      console.error('Failed to generate download URL:', error)
      setDownloadProgress(file.key, {
        key: file.key,
        name: file.name,
        progress: 0,
        status: 'error',
        speed: 0,
        downloadedBytes: 0,
        totalBytes: file.size,
      })
    }
  }

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
            <button
              onClick={handleDownload}
              className="btn btn-primary"
            >
              Download File
            </button>
          </div>
        </div>
      )
    }

    if (isTextFile(file.name)) {
      return (
        <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <pre className="whitespace-pre-wrap break-words text-sm text-gray-900 dark:text-gray-100">
            {textContent || 'This file is empty.'}
          </pre>
        </div>
      )
    }

    if (!previewUrl) return null

    if (isImageFile(file.name)) {
      return (
        <div className="flex justify-center">
          <img
            src={previewUrl}
            alt={file.name}
            className="max-w-full max-h-96 object-contain rounded-lg"
          />
        </div>
      )
    }

    if (isVideoFile(file.name)) {
      return (
        <div className="flex justify-center">
          <video
            controls
            className="max-w-full max-h-96 rounded-lg"
            src={previewUrl}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (isPdfFile(file.name)) {
      return (
        <iframe
          src={previewUrl}
          title={file.name}
          className="h-[70vh] w-full rounded-lg border border-gray-200 dark:border-gray-700"
        />
      )
    }

    if (isAudioFile(file.name)) {
      return (
        <div className="flex justify-center">
          <audio
            controls
            className="w-full max-w-md"
            src={previewUrl}
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Preview not available for this file type.
          </p>
          <button
            onClick={handleDownload}
            className="btn btn-primary"
          >
            Download File
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {file.name}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span>{formatFileSize(file.size)}</span>
              <span>{formatDateTime(file.lastModified)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="btn btn-outline"
              title="Download"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {renderPreview()}
        </div>
      </div>
    </div>
  )
}

export default PreviewModal
