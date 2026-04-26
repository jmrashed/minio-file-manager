
import {
  FolderIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  CodeBracketIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { FileObject } from '../services/fileService'
import { formatFileSize, formatDateTime, getFileIcon, isImageFile, isVideoFile } from '../utils/formatters'
import { useAppStore } from '../store/appStore'
import toast from 'react-hot-toast'
import PreviewModal from './PreviewModal'

interface FileListProps {
  files: FileObject[]
  loading: boolean
  onPathChange: (path: string) => void
  onRefresh: () => void
}

const FileList = ({ files, loading, onPathChange, onRefresh }: FileListProps) => {
  const { viewMode } = useAppStore()
  const [previewFile, setPreviewFile] = useState<FileObject | null>(null)

  const getFileIconComponent = (file: FileObject) => {
    if (file.type === 'folder') {
      return <FolderIcon className="h-8 w-8 text-yellow-500" />
    }

    const iconType = getFileIcon(file.name)

    switch (iconType) {
      case 'image':
        return <PhotoIcon className="h-8 w-8 text-green-500" />
      case 'video':
        return <VideoCameraIcon className="h-8 w-8 text-red-500" />
      case 'music':
        return <MusicalNoteIcon className="h-8 w-8 text-purple-500" />
      case 'archive':
        return <ArchiveBoxIcon className="h-8 w-8 text-orange-500" />
      case 'code':
        return <CodeBracketIcon className="h-8 w-8 text-blue-500" />
      default:
        return <DocumentIcon className="h-8 w-8 text-gray-500" />
    }
  }

  const handleFileClick = (file: FileObject) => {
    if (file.type === 'folder') {
      const newPath = file.key
      onPathChange(newPath)
    } else {
      // Handle file preview/download
      setPreviewFile(file)
    }
  }

  const handleDownload = async (file: FileObject) => {
    try {
      // For now, just show a toast. In a real implementation, you'd generate a presigned URL
      toast.success(`Download started for ${file.name}`)
    } catch (error) {
      toast.error('Failed to download file')
    }
  }

  const handleDelete = async (file: FileObject) => {
    try {
      // For now, just show a toast. In a real implementation, you'd call the delete API
      toast.success(`Deleted ${file.name}`)
      onRefresh()
    } catch (error) {
      toast.error('Failed to delete file')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-8 w-8 rounded"></div>
            <div className="flex-1">
              <div className="bg-gray-200 dark:bg-gray-700 h-4 w-1/4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-3 w-1/6 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No files</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          This folder is empty.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {files.length} item{files.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="btn btn-outline text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
        {files.map((file) => (
          <div
            key={file.key}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            onClick={() => handleFileClick(file)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIconComponent(file)}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {file.type === 'file' && (
                      <>
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{formatDateTime(file.lastModified)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 ml-2">
                {file.type === 'file' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(file)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    {(isImageFile(file.name) || isVideoFile(file.name)) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewFile(file)
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                        title="Preview"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(file)
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  )
}

export default FileList