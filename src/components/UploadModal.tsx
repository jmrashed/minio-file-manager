import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { XMarkIcon, CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { formatFileSize } from '../utils/formatters'
import { useUpload } from '../hooks/useUpload'

interface UploadModalProps {
  bucket: string
  path: string
  onClose: () => void
  onUploadComplete: () => void
}

const UploadModal = ({ bucket, path, onClose, onUploadComplete }: UploadModalProps) => {
  const [files, setFiles] = useState<File[]>([])

  const { queueUploads } = useUpload()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    queueUploads({
      bucket,
      files,
      path,
    })

    onUploadComplete()
    onClose()
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upload Files
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-lg text-primary-600 dark:text-primary-400">
                Drop the files here...
              </p>
            ) : (
              <div>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Support for multiple files
                </p>
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Files to upload ({files.length})
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total: {formatFileSize(totalSize)}
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <DocumentIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 ml-2"
                      disabled={false}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0}
            className="btn btn-primary"
          >
            {`Queue ${files.length} File${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadModal
