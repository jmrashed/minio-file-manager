import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  MoonIcon,
  PlusIcon,
  SunIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import BucketSelector from './BucketSelector'
import Breadcrumb from './Breadcrumb'
import FileList from './FileList'
import UploadModal from './UploadModal'
import TransferPanel from './TransferPanel'
import { useBuckets } from '../hooks/useBuckets'
import { useFiles } from '../hooks/useFiles'
import {
  createBucket,
  createFolder,
  createEmptyFile,
  deleteBucket,
} from '../services/fileService'
import { useAppStore } from '../store/appStore'
import { validateBucketName, validateFileName } from '../utils/validators'
import toast from 'react-hot-toast'

const FileManager = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentBucket, setCurrentBucket] = useState('')
  const [currentPath, setCurrentPath] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)

  const { data: buckets = [], isLoading: bucketsLoading, refetch: refetchBuckets } = useBuckets()
  const {
    files,
    isLoading: filesLoading,
    refetch: refetchFiles,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useFiles(currentBucket, currentPath)

  useEffect(() => {
    const credentials = localStorage.getItem('minio-credentials')
    if (!credentials) {
      navigate('/login')
    } else if (buckets.length > 0 && !currentBucket) {
      setCurrentBucket(buckets[0].name)
    }
  }, [navigate, buckets, currentBucket])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const handleBucketChange = (bucket: string) => {
    setCurrentBucket(bucket)
    setCurrentPath('')
  }

  const handlePathChange = (path: string) => {
    setCurrentPath(path)
  }

  const handleUploadComplete = () => {
    setShowUploadModal(false)
  }

  const handleCreateFolder = async () => {
    const name = window.prompt('Enter folder name:')
    if (!name) return

    const validation = validateFileName(name)
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid folder name')
      return
    }

    try {
      const key = currentPath + name + '/'
      await createFolder(currentBucket, key)
      refetchFiles()
      toast.success(`Created folder ${name}`)
    } catch (error) {
      toast.error('Failed to create folder')
      console.error('Create folder error:', error)
    }
  }

  const handleCreateFile = async () => {
    const name = window.prompt('Enter file name:')
    if (!name) return

    const validation = validateFileName(name)
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file name')
      return
    }

    try {
      const key = currentPath + name
      await createEmptyFile(currentBucket, key)
      refetchFiles()
      toast.success(`Created file ${name}`)
    } catch (error) {
      toast.error('Failed to create file')
      console.error('Create file error:', error)
    }
  }

  const handleCreateBucket = async () => {
    const name = window.prompt('Enter a new bucket name:')
    if (!name) return

    const validation = validateBucketName(name)
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid bucket name')
      return
    }

    try {
      await createBucket(name)
      await refetchBuckets()
      queryClient.invalidateQueries({ queryKey: ['buckets'] })
      setCurrentBucket(name)
      setCurrentPath('')
      toast.success(`Created bucket ${name}`)
    } catch (error) {
      toast.error('Failed to create bucket')
      console.error('Create bucket error:', error)
    }
  }

  const handleDeleteBucket = async () => {
    if (!currentBucket) return
    if (!window.confirm(`Delete bucket "${currentBucket}"? This only works when the bucket is empty.`)) {
      return
    }

    try {
      await deleteBucket(currentBucket)
      await refetchBuckets()
      queryClient.invalidateQueries({ queryKey: ['buckets'] })
      const remainingBucket = buckets.find((bucket) => bucket.name !== currentBucket)
      setCurrentBucket(remainingBucket?.name || '')
      setCurrentPath('')
      toast.success(`Deleted bucket ${currentBucket}`)
    } catch (error) {
      toast.error('Failed to delete bucket. Make sure the bucket is empty.')
      console.error('Delete bucket error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col justify-center gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                MinIO File Manager
              </h1>
              <BucketSelector
                buckets={buckets}
                currentBucket={currentBucket}
                onBucketChange={handleBucketChange}
                loading={bucketsLoading}
              />
              <button
                onClick={handleCreateBucket}
                className="btn btn-outline text-sm"
                title="Create bucket"
              >
                <PlusIcon className="mr-1 inline h-4 w-4" />
                Bucket
              </button>
              <button
                onClick={handleDeleteBucket}
                className="btn btn-outline text-sm text-red-600 hover:text-red-700"
                disabled={!currentBucket}
                title="Delete current bucket"
              >
                <TrashIcon className="mr-1 inline h-4 w-4" />
                Delete Bucket
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCreateFile}
                className="btn btn-outline"
                disabled={!currentBucket}
              >
                Create File
              </button>
              <button
                onClick={handleCreateFolder}
                className="btn btn-outline"
                disabled={!currentBucket}
              >
                Create Folder
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary"
                disabled={!currentBucket}
              >
                Upload Files
              </button>
              <button
                onClick={toggleTheme}
                className="btn btn-outline"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
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
        <TransferPanel />

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
              bucket={currentBucket}
              currentPath={currentPath}
              hasMore={!!hasNextPage}
              onLoadMore={() => fetchNextPage()}
              loadingMore={isFetchingNextPage}
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
