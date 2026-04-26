import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BucketSelector from './BucketSelector'
import Breadcrumb from './Breadcrumb'
import FileList from './FileList'
import UploadModal from './UploadModal'
import { useBuckets } from '../hooks/useBuckets'
import { useFiles } from '../hooks/useFiles'

const FileManager = () => {
  const navigate = useNavigate()
  const [currentBucket, setCurrentBucket] = useState('')
  const [currentPath, setCurrentPath] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)

  const { data: buckets = [], isLoading: bucketsLoading } = useBuckets()
  const { data: files = [], isLoading: filesLoading, refetch: refetchFiles } = useFiles(currentBucket, currentPath)

  useEffect(() => {
    // Check if user is logged in
    const credentials = localStorage.getItem('minio-credentials')
    if (!credentials) {
      navigate('/login')
    } else if (buckets.length > 0 && !currentBucket) {
      setCurrentBucket(buckets[0].name)
    }
  }, [navigate, buckets, currentBucket])

  const handleBucketChange = (bucket: string) => {
    setCurrentBucket(bucket)
    setCurrentPath('')
  }

  const handlePathChange = (path: string) => {
    setCurrentPath(path)
  }

  const handleUploadComplete = () => {
    setShowUploadModal(false)
    refetchFiles()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                MinIO File Manager
              </h1>
              <BucketSelector
                buckets={buckets}
                currentBucket={currentBucket}
                onBucketChange={handleBucketChange}
                loading={bucketsLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary"
                disabled={!currentBucket}
              >
                Upload Files
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('minio-credentials')
                  navigate('/login')
                }}
                className="btn btn-outline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <Breadcrumb
              bucket={currentBucket}
              path={currentPath}
              onPathChange={handlePathChange}
            />
          </div>
          <div className="p-6">
            <FileList
              files={files}
              loading={filesLoading}
              onPathChange={handlePathChange}
              onRefresh={refetchFiles}
            />
          </div>
        </div>
      </main>

      {showUploadModal && (
        <UploadModal
          bucket={currentBucket}
          path={currentPath}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  )
}

export default FileManager