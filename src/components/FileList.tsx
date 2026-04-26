import {
  ArrowDownTrayIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
  EyeIcon,
  FolderIcon,
  ListBulletIcon,
  MusicalNoteIcon,
  PencilIcon,
  PhotoIcon,
  ScissorsIcon,
  Squares2X2Icon,
  TrashIcon,
  VideoCameraIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline'
import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  FileObject,
  copyFile,
  deleteObjects,
  downloadAsZip,
  downloadFileWithProgress,
  downloadFolderAsZip,
  renameFile,
} from '../services/fileService'
import {
  formatDateTime,
  formatFileSize,
  getFileIcon,
  getFileType,
  isAudioFile,
  isImageFile,
  isPdfFile,
  isTextFile,
  isVideoFile,
} from '../utils/formatters'
import { useAppStore } from '../store/appStore'
import toast from 'react-hot-toast'
import PreviewModal from './PreviewModal'

interface FileListProps {
  files: FileObject[]
  loading: boolean
  onPathChange: (path: string) => void
  onRefresh: () => void
  bucket: string
  currentPath: string
  hasMore: boolean
  onLoadMore: () => void
  loadingMore: boolean
}

const FileList = ({
  files,
  loading,
  onPathChange,
  onRefresh,
  bucket,
  currentPath,
  hasMore,
  onLoadMore,
  loadingMore,
}: FileListProps) => {
  const {
    viewMode,
    selectedFiles,
    toggleFileSelection,
    setSelectedFiles,
    clearSelection,
    selectRange,
    setViewMode,
    showHidden,
    setShowHidden,
    sortBy,
    sortOrder,
    setSort,
    filterBy,
    setFilterBy,
    clipboard,
    setClipboard,
    contextMenu,
    showContextMenu,
    hideContextMenu,
    setDownloadProgress,
  } = useAppStore()

  const [previewFile, setPreviewFile] = useState<FileObject | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [lastSelected, setLastSelected] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const canPreviewFile = (file: FileObject) =>
    file.type === 'file' &&
    (isImageFile(file.name) ||
      isVideoFile(file.name) ||
      isAudioFile(file.name) ||
      isTextFile(file.name) ||
      isPdfFile(file.name))

  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renaming])

  useEffect(() => {
    const handleGlobalClick = () => hideContextMenu()
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideContextMenu()
      }
    }

    window.addEventListener('click', handleGlobalClick)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('click', handleGlobalClick)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [hideContextMenu])

  useEffect(() => {
    if (!hasMore || loadingMore || !loadMoreRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, loadingMore, onLoadMore])

  const filteredFiles = useMemo(
    () =>
      files.filter(
        (file) =>
          file.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (showHidden || !file.name.startsWith('.')) &&
          (filterBy === 'all' || getFileType(file.name, file.type) === filterBy)
      ),
    [files, filterBy, searchTerm, showHidden]
  )

  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      if (sortBy === 'name') {
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
      } else if (sortBy === 'date') {
        aValue = a.lastModified.getTime()
        bValue = b.lastModified.getTime()
      } else if (sortBy === 'type') {
        aValue = getFileType(a.name, a.type)
        bValue = getFileType(b.name, b.type)
      } else {
        aValue = a.size
        bValue = b.size
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      }

      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    })
  }, [filteredFiles, sortBy, sortOrder])

  const fileLookup = useMemo(
    () =>
      new Map(sortedFiles.map((file) => [file.key, file])),
    [sortedFiles]
  )

  const contextFile = contextMenu.fileKey ? fileLookup.get(contextMenu.fileKey) ?? null : null

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (event.key === 'Delete' && selectedFiles.length > 0) {
        event.preventDefault()
        void handleBulkDelete()
      }

      if (event.key.toLowerCase() === 'a' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        setSelectedFiles(filteredFiles.map((file) => file.key))
      }

      if (event.key === 'F2' && selectedFiles.length === 1) {
        event.preventDefault()
        const file = filteredFiles.find((item) => item.key === selectedFiles[0])
        if (file) {
          startRename(file)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredFiles, selectedFiles, setSelectedFiles])

  const getFileIconComponent = (file: FileObject) => {
    if (file.type === 'folder') {
      return <FolderIcon className="h-8 w-8 flex-shrink-0 text-yellow-500" />
    }

    const iconType = getFileIcon(file.name)

    switch (iconType) {
      case 'image':
        return <PhotoIcon className="h-8 w-8 flex-shrink-0 text-green-500" />
      case 'video':
        return <VideoCameraIcon className="h-8 w-8 flex-shrink-0 text-red-500" />
      case 'music':
        return <MusicalNoteIcon className="h-8 w-8 flex-shrink-0 text-purple-500" />
      case 'archive':
        return <ArchiveBoxIcon className="h-8 w-8 flex-shrink-0 text-orange-500" />
      case 'code':
        return <CodeBracketIcon className="h-8 w-8 flex-shrink-0 text-blue-500" />
      default:
        return <DocumentIcon className="h-8 w-8 flex-shrink-0 text-gray-500" />
    }
  }

  const runTrackedDownload = async (
    key: string,
    name: string,
    runner: () => Promise<void>
  ) => {
    setDownloadProgress(key, {
      key,
      name,
      progress: 0,
      status: 'downloading',
      speed: 0,
      downloadedBytes: 0,
      totalBytes: 0,
    })

    try {
      await runner()
      setDownloadProgress(key, {
        key,
        name,
        progress: 100,
        status: 'completed',
        speed: 0,
        downloadedBytes: 1,
        totalBytes: 1,
      })
      toast.success(`Download started for ${name}`)
    } catch (error) {
      setDownloadProgress(key, {
        key,
        name,
        progress: 0,
        status: 'error',
        speed: 0,
        downloadedBytes: 0,
        totalBytes: 0,
      })
      toast.error(`Failed to download ${name}`)
      console.error('Download error:', error)
    }
  }

  const handleFileClick = (file: FileObject) => {
    if (file.type === 'folder') {
      onPathChange(file.key)
      return
    }

    if (canPreviewFile(file)) {
      setPreviewFile(file)
      return
    }

    void handleDownload(file)
  }

  const handleDownload = async (file: FileObject) => {
    await runTrackedDownload(file.key, file.name, async () => {
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
    })
  }

  const handleDelete = async (file: FileObject) => {
    if (!window.confirm(`Are you sure you want to delete "${file.name}"?`)) return

    try {
      await deleteObjects(bucket, [file.key])
      toast.success(`Deleted ${file.name}`)
      onRefresh()
    } catch (error) {
      toast.error('Failed to delete file')
      console.error('Delete error:', error)
    }
  }

  const startRename = (file: FileObject) => {
    setRenaming(file.key)
    setRenameValue(file.name.replace(/\/$/, ''))
    hideContextMenu()
  }

  const handleRenameSubmit = async (file: FileObject) => {
    const trimmedValue = renameValue.trim()
    const normalizedName = file.name.replace(/\/$/, '')

    if (!trimmedValue || trimmedValue === normalizedName) {
      setRenaming(null)
      return
    }

    try {
      const newKey = file.key.endsWith('/')
        ? `${file.key.slice(0, -file.name.length)}${trimmedValue}/`
        : file.key.replace(file.name, trimmedValue)
      await renameFile(bucket, file.key, newKey)
      onRefresh()
      toast.success(`Renamed to ${trimmedValue}`)
    } catch (error) {
      toast.error('Failed to rename file')
      console.error('Rename error:', error)
    } finally {
      setRenaming(null)
    }
  }

  const handleDuplicate = async (file: FileObject) => {
    const normalizedName = file.name.replace(/\/$/, '')
    const baseName = normalizedName.split('.').slice(0, -1).join('.') || normalizedName
    const extension = normalizedName.split('.').pop()
    const nextName =
      extension && extension !== normalizedName
        ? `${baseName} (copy).${extension}`
        : `${normalizedName} (copy)`
    const nextKey = file.key.endsWith('/')
      ? `${file.key.slice(0, -file.name.length)}${nextName}/`
      : file.key.replace(file.name, nextName)

    try {
      await copyFile(bucket, file.key, nextKey)
      onRefresh()
      toast.success(`Duplicated as ${nextName}`)
    } catch (error) {
      toast.error('Failed to duplicate file')
      console.error('Duplicate error:', error)
    }
  }

  const handleCopyToClipboard = (file: FileObject) => {
    setClipboard({
      keys: [file.key],
      action: 'copy',
      sourceBucket: bucket,
      sourcePath: currentPath,
    })
    hideContextMenu()
    toast.success('Copied to clipboard')
  }

  const handleCutToClipboard = (file: FileObject) => {
    setClipboard({
      keys: [file.key],
      action: 'cut',
      sourceBucket: bucket,
      sourcePath: currentPath,
    })
    hideContextMenu()
    toast.success('Cut to clipboard')
  }

  const handlePaste = async () => {
    if (!clipboard) return

    if (clipboard.sourceBucket !== bucket) {
      toast.error('Cannot paste across buckets')
      return
    }

    try {
      for (const key of clipboard.keys) {
        const fileName = key.split('/').filter(Boolean).pop() || key
        const destinationKey = `${currentPath}${fileName}`
        await copyFile(bucket, key, destinationKey)

        if (clipboard.action === 'cut') {
          await deleteObjects(bucket, [key])
        }
      }

      setClipboard(null)
      onRefresh()
      toast.success(clipboard.action === 'cut' ? 'Moved successfully' : 'Copied successfully')
    } catch (error) {
      toast.error('Failed to paste')
      console.error('Paste error:', error)
    }
  }

  const handleMove = async (file: FileObject) => {
    const destinationPath = window.prompt(
      'Enter destination path (including filename):',
      `${currentPath}${file.name.replace(/\/$/, '')}`
    )

    if (!destinationPath) return

    try {
      const nextKey = file.key.endsWith('/') && !destinationPath.endsWith('/') ? `${destinationPath}/` : destinationPath
      await copyFile(bucket, file.key, nextKey)
      await deleteObjects(bucket, [file.key])
      onRefresh()
      toast.success(`Moved to ${nextKey}`)
    } catch (error) {
      toast.error('Failed to move file')
      console.error('Move error:', error)
    }
  }

  const handleDownloadFolder = async (file: FileObject) => {
    await runTrackedDownload(file.key, `${file.name} ZIP`, async () => {
      await downloadFolderAsZip(bucket, file.key, (progress) => {
        setDownloadProgress(file.key, {
          key: file.key,
          name: `${file.name} ZIP`,
          progress: progress.progress,
          status: 'downloading',
          speed: progress.speed,
          downloadedBytes: progress.loaded,
          totalBytes: progress.total,
        })
      })
    })
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return
    if (!window.confirm(`Delete ${selectedFiles.length} selected items?`)) return

    try {
      await deleteObjects(bucket, selectedFiles)
      clearSelection()
      onRefresh()
      toast.success(`Deleted ${selectedFiles.length} items`)
    } catch (error) {
      toast.error('Failed to delete files')
      console.error('Delete error:', error)
    }
  }

  const handleBulkDownload = async () => {
    if (selectedFiles.length === 0) return

    const zipKey = `zip:${bucket}:${currentPath || 'root'}:${selectedFiles.join(',')}`
    await runTrackedDownload(zipKey, 'selected-files.zip', async () => {
      await downloadAsZip(bucket, selectedFiles, 'selected-files.zip', (progress) => {
        setDownloadProgress(zipKey, {
          key: zipKey,
          name: 'selected-files.zip',
          progress: progress.progress,
          status: 'downloading',
          speed: progress.speed,
          downloadedBytes: progress.loaded,
          totalBytes: progress.total,
        })
      })
    })
  }

  const handleContextMenuOpen = (event: MouseEvent, file: FileObject) => {
    event.preventDefault()
    event.stopPropagation()

    if (!selectedFiles.includes(file.key)) {
      setSelectedFiles([file.key])
    }

    showContextMenu(event.clientX, event.clientY, file.key)
  }

  const handleCheckboxClick = (event: MouseEvent | ChangeEvent<HTMLInputElement>, file: FileObject) => {
    event.stopPropagation()

    if ('shiftKey' in event && event.shiftKey && lastSelected) {
      selectRange(lastSelected, file.key, filteredFiles.map((item) => item.key))
    } else {
      toggleFileSelection(file.key)
    }

    setLastSelected(file.key)
  }

  const allSelected =
    filteredFiles.length > 0 &&
    filteredFiles.every((file) => selectedFiles.includes(file.key))

  const renderActionButtons = (file: FileObject, compact = false) => {
    const buttonClass = compact
      ? 'rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      : 'rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'

    return (
      <div className={`flex items-center ${compact ? 'space-x-1' : 'space-x-1 opacity-0 transition-opacity group-hover:opacity-100'}`}>
        {file.type === 'folder' ? (
          <>
            <button
              onClick={(event) => {
                event.stopPropagation()
                onPathChange(file.key)
              }}
              className={buttonClass}
              title="Open folder"
            >
              <FolderIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation()
                void handleDownloadFolder(file)
              }}
              className={buttonClass}
              title="Download folder as ZIP"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(event) => {
                event.stopPropagation()
                void handleDownload(file)
              }}
              className={buttonClass}
              title="Download"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
            {canPreviewFile(file) && (
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  setPreviewFile(file)
                }}
                className={buttonClass}
                title="Preview"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={(event) => {
                event.stopPropagation()
                startRename(file)
              }}
              className={buttonClass}
              title="Rename"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation()
                void handleDuplicate(file)
              }}
              className={buttonClass}
              title="Duplicate"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
          </>
        )}

        <button
          onClick={(event) => {
            event.stopPropagation()
            handleCopyToClipboard(file)
          }}
          className={buttonClass}
          title="Copy"
        >
          <ClipboardDocumentIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation()
            handleCutToClipboard(file)
          }}
          className={buttonClass}
          title="Cut"
        >
          <ScissorsIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation()
            void handleMove(file)
          }}
          className={buttonClass}
          title="Move"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation()
            void handleDelete(file)
          }}
          className="rounded p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    )
  }

  const Toolbar = () => (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center space-x-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => {
              if (event.target.checked) {
                setSelectedFiles(filteredFiles.map((file) => file.key))
              } else {
                clearSelection()
              }
            }}
            className="rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Select All</span>
        </label>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredFiles.length} item{filteredFiles.length !== 1 ? 's' : ''}
          {searchTerm && ` (filtered from ${files.length})`}
        </div>

        {selectedFiles.length > 0 && (
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
            {selectedFiles.length} selected
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selectedFiles.length > 0 && (
          <>
            <button
              onClick={() => void handleBulkDelete()}
              className="btn btn-outline text-sm text-red-600 hover:text-red-700"
            >
              <TrashIcon className="mr-1 inline h-4 w-4" />
              Delete
            </button>
            <button onClick={() => void handleBulkDownload()} className="btn btn-outline text-sm">
              <ArrowDownTrayIcon className="mr-1 inline h-4 w-4" />
              Download ZIP
            </button>
          </>
        )}

        {clipboard && clipboard.sourceBucket === bucket && (
          <button onClick={() => void handlePaste()} className="btn btn-outline text-sm">
            <ClipboardDocumentIcon className="mr-1 inline h-4 w-4" />
            Paste
          </button>
        )}

        <label className="flex cursor-pointer items-center space-x-2">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(event) => setShowHidden(event.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Hidden</span>
        </label>

        <select
          value={filterBy}
          onChange={(event) => setFilterBy(event.target.value)}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Files</option>
          <option value="folder">Folders</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
          <option value="document">Documents</option>
          <option value="archive">Archives</option>
          <option value="code">Code</option>
          <option value="other">Other</option>
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(event) => {
            const [by, order] = event.target.value.split('-') as [
              'name' | 'date' | 'size' | 'type',
              'asc' | 'desc',
            ]
            setSort(by, order)
          }}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="size-desc">Largest First</option>
          <option value="size-asc">Smallest First</option>
          <option value="type-asc">Type A-Z</option>
          <option value="type-desc">Type Z-A</option>
        </select>

        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-44 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />

        <div className="flex overflow-hidden rounded-md border border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 ${
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Grid view"
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="List view"
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
        </div>

        <button onClick={onRefresh} className="btn btn-outline text-sm">
          Refresh
        </button>
      </div>
    </div>
  )

  const GridView = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {sortedFiles.map((file) => (
        <div
          key={file.key}
          className={`group cursor-pointer rounded-lg border p-4 transition-colors ${
            selectedFiles.includes(file.key)
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
          }`}
          onClick={() => handleFileClick(file)}
          onContextMenu={(event) => handleContextMenuOpen(event, file)}
        >
          <div className="mb-3 flex items-start justify-between">
            <input
              type="checkbox"
              checked={selectedFiles.includes(file.key)}
              onChange={(event) => handleCheckboxClick(event, file)}
              onClick={(event) => event.stopPropagation()}
              className="rounded"
            />
            {renderActionButtons(file)}
          </div>

          <div className="flex flex-col items-center text-center">
            {getFileIconComponent(file)}
            {renaming === file.key ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleRenameSubmit(file)
                  }
                  if (event.key === 'Escape') {
                    setRenaming(null)
                  }
                }}
                onBlur={() => void handleRenameSubmit(file)}
                onClick={(event) => event.stopPropagation()}
                className="mt-2 w-full rounded border border-primary-500 px-1 text-center text-sm font-medium"
              />
            ) : (
              <h3
                className="mt-2 w-full truncate text-sm font-medium text-gray-900 dark:text-white"
                title={file.name}
              >
                {file.name}
              </h3>
            )}
            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              {file.type === 'file' && <span>{formatFileSize(file.size)}</span>}
              <span>{formatDateTime(file.lastModified)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const ListView = () => (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <div className="w-8" />
        <div>Name</div>
        <div>Size</div>
        <div>Type</div>
        <div>Modified</div>
        <div>Actions</div>
      </div>

      {sortedFiles.map((file) => (
        <div
          key={file.key}
          className={`grid cursor-pointer grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 border-b border-gray-100 px-4 py-3 transition-colors last:border-0 dark:border-gray-800 ${
            selectedFiles.includes(file.key)
              ? 'bg-primary-50 dark:bg-primary-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
          onClick={() => handleFileClick(file)}
          onContextMenu={(event) => handleContextMenuOpen(event, file)}
        >
          <div className="flex w-8 justify-center">
            <input
              type="checkbox"
              checked={selectedFiles.includes(file.key)}
              onChange={(event) => handleCheckboxClick(event, file)}
              onClick={(event) => event.stopPropagation()}
              className="rounded"
            />
          </div>

          <div className="flex min-w-0 items-center space-x-3">
            {getFileIconComponent(file)}
            {renaming === file.key ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleRenameSubmit(file)
                  }
                  if (event.key === 'Escape') {
                    setRenaming(null)
                  }
                }}
                onBlur={() => void handleRenameSubmit(file)}
                onClick={(event) => event.stopPropagation()}
                className="w-full rounded border border-primary-500 px-1 text-sm font-medium"
              />
            ) : (
              <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {file.name}
              </span>
            )}
          </div>

          <div className="w-24 text-right text-sm text-gray-500 dark:text-gray-400">
            {file.type === 'file' ? formatFileSize(file.size) : '--'}
          </div>
          <div className="w-24 text-sm capitalize text-gray-500 dark:text-gray-400">
            {getFileType(file.name, file.type)}
          </div>
          <div className="w-36 text-sm text-gray-500 dark:text-gray-400">
            {formatDateTime(file.lastModified)}
          </div>
          <div className="flex w-52 justify-end">
            {renderActionButtons(file, true)}
          </div>
        </div>
      ))}
    </div>
  )

  const ContextMenu = () => {
    if (!contextMenu.visible || !contextFile) return null

    return (
      <div
        className="fixed z-50 min-w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        onClick={(event) => event.stopPropagation()}
      >
        {contextFile.type === 'folder' ? (
          <button
            onClick={() => {
              onPathChange(contextFile.key)
              hideContextMenu()
            }}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Open folder
          </button>
        ) : canPreviewFile(contextFile) ? (
          <button
            onClick={() => {
              setPreviewFile(contextFile)
              hideContextMenu()
            }}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Preview
          </button>
        ) : null}

        <button
          onClick={() => {
            if (contextFile.type === 'folder') {
              void handleDownloadFolder(contextFile)
            } else {
              void handleDownload(contextFile)
            }
            hideContextMenu()
          }}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Download
        </button>
        <button
          onClick={() => startRename(contextFile)}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Rename
        </button>
        {contextFile.type === 'file' && (
          <button
            onClick={() => {
              void handleDuplicate(contextFile)
              hideContextMenu()
            }}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Duplicate
          </button>
        )}
        <button
          onClick={() => handleCopyToClipboard(contextFile)}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Copy
        </button>
        <button
          onClick={() => handleCutToClipboard(contextFile)}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Cut
        </button>
        <button
          onClick={() => {
            void handleMove(contextFile)
            hideContextMenu()
          }}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Move
        </button>
        <button
          onClick={() => {
            void handleDelete(contextFile)
            hideContextMenu()
          }}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Delete
        </button>
      </div>
    )
  }

  return (
    <div>
      <Toolbar />

      {loading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex animate-pulse items-center space-x-4">
              <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="mb-2 h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/6 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="py-12 text-center">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {searchTerm ? 'No matching files' : 'No files'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search term.' : 'This folder is empty.'}
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? <GridView /> : <ListView />}

          {(hasMore || loadingMore) && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div ref={loadMoreRef} className="h-1 w-full" />
              {hasMore && (
                <button
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="btn btn-outline text-sm"
                >
                  {loadingMore ? 'Loading more...' : 'Load more files'}
                </button>
              )}
            </div>
          )}
        </>
      )}

      <ContextMenu />

      <PreviewModal
        file={previewFile}
        bucket={bucket}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  )
}

export default FileList
