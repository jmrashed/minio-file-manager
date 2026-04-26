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
  PencilIcon,
  DocumentDuplicateIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
  ScissorsIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import { useState, useEffect, useRef } from 'react'
import {
  FileObject,
  getPresignedDownloadUrl,
  deleteObjects,
  renameFile,
  copyFile,
  downloadAsZip,
  downloadFolderAsZip,
} from '../services/fileService'
import {
  formatFileSize,
  formatDateTime,
  getFileIcon,
  isImageFile,
  isVideoFile,
  getFileType,
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
}

const FileList = ({ files, loading, onPathChange, onRefresh, bucket, currentPath }: FileListProps) => {
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
    showContextMenu,
  } = useAppStore()

  const [previewFile, setPreviewFile] = useState<FileObject | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [lastSelected, setLastSelected] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    const loadPreviews = async () => {
      const newUrls: Record<string, string> = {}
      for (const file of files) {
        if (isImageFile(file.name) || isVideoFile(file.name)) {
          try {
            const url = await getPresignedDownloadUrl(bucket, file.key)
            if (!cancelled) newUrls[file.key] = url
          } catch (error) {
            console.error('Failed to get preview url', error)
          }
        }
      }
      if (!cancelled) setPreviewUrls(newUrls)
    }
    loadPreviews()
    return () => { cancelled = true }
  }, [files, bucket])

  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renaming])

  const getFileIconComponent = (file: FileObject) => {
    if (file.type === 'folder') {
      return <FolderIcon className="h-8 w-8 text-yellow-500 flex-shrink-0" />
    }
    if (viewMode === 'grid' && isImageFile(file.name) && previewUrls[file.key]) {
      return (
        <img
          src={previewUrls[file.key]}
          alt={file.name}
          className="h-16 w-16 object-cover rounded flex-shrink-0"
          loading="lazy"
        />
      )
    }
    const iconType = getFileIcon(file.name)
    switch (iconType) {
      case 'image':
        return <PhotoIcon className="h-8 w-8 text-green-500 flex-shrink-0" />
      case 'video':
        return <VideoCameraIcon className="h-8 w-8 text-red-500 flex-shrink-0" />
      case 'music':
        return <MusicalNoteIcon className="h-8 w-8 text-purple-500 flex-shrink-0" />
      case 'archive':
        return <ArchiveBoxIcon className="h-8 w-8 text-orange-500 flex-shrink-0" />
      case 'code':
        return <CodeBracketIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
      default:
        return <DocumentIcon className="h-8 w-8 text-gray-500 flex-shrink-0" />
    }
  }

  const handleFileClick = (file: FileObject) => {
    if (file.type === 'folder') {
      onPathChange(file.key)
    } else {
      setPreviewFile(file)
    }
  }

  const handleDownload = async (file: FileObject) => {
    try {
      const downloadUrl = await getPresignedDownloadUrl(bucket, file.key)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Download started for ${file.name}`)
    } catch (error) {
      toast.error('Failed to download file')
      console.error('Download error:', error)
    }
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
    setRenameValue(file.name)
  }

  const handleRenameSubmit = async (file: FileObject) => {
    if (!renameValue || renameValue === file.name) {
      setRenaming(null)
      return
    }
    try {
      const newKey = file.key.replace(file.name, renameValue)
      await renameFile(bucket, file.key, newKey)
      onRefresh()
      toast.success(`Renamed to ${renameValue}`)
    } catch (error) {
      toast.error('Failed to rename file')
      console.error('Rename error:', error)
    } finally {
      setRenaming(null)
    }
  }

   const handleDuplicate = async (file: FileObject) => {
     const baseName = file.name.split('.').slice(0, -1).join('.') || file.name
     const ext = file.name.split('.').pop()
     const newName = ext && ext !== file.name ? `${baseName} (copy).${ext}` : `${file.name} (copy)`
     try {
       const newKey = file.key.replace(file.name, newName)
       await copyFile(bucket, file.key, newKey)
       onRefresh()
       toast.success(`Duplicated as ${newName}`)
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
    toast.success('Copied to clipboard')
  }

  const handleCutToClipboard = (file: FileObject) => {
    setClipboard({
      keys: [file.key],
      action: 'cut',
      sourceBucket: bucket,
      sourcePath: currentPath,
    })
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
        const fileName = key.split('/').pop() || key
        const destKey = currentPath + fileName
        await copyFile(bucket, key, destKey)
        if (clipboard.action === 'cut') {
          await deleteObjects(bucket, [key])
        }
      }
      setClipboard(null)
      onRefresh()
      toast.success(
        clipboard.action === 'cut' ? 'Moved successfully' : 'Copied successfully'
      )
    } catch (error) {
      toast.error('Failed to paste')
      console.error('Paste error:', error)
    }
  }

  const handleMove = async (file: FileObject) => {
    const destPath = window.prompt(
      'Enter destination path (including filename):',
      currentPath + file.name
    )
    if (!destPath) return
    try {
      await copyFile(bucket, file.key, destPath)
      await deleteObjects(bucket, [file.key])
      onRefresh()
      toast.success(`Moved to ${destPath}`)
    } catch (error) {
      toast.error('Failed to move file')
      console.error('Move error:', error)
    }
  }

  const handleDownloadFolder = async (file: FileObject) => {
    try {
      await downloadFolderAsZip(bucket, file.key)
      toast.success(`Downloaded folder ${file.name} as ZIP`)
    } catch (error) {
      toast.error('Failed to download folder')
      console.error('Download folder error:', error)
    }
  }

  const filteredFiles = files.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (showHidden || !file.name.startsWith('.')) &&
      (filterBy === 'all' || getFileType(file.name, file.type) === filterBy)
  )

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number
    if (sortBy === 'name') {
      aVal = a.name.toLowerCase()
      bVal = b.name.toLowerCase()
    } else if (sortBy === 'date') {
      aVal = a.lastModified.getTime()
      bVal = b.lastModified.getTime()
    } else if (sortBy === 'type') {
      aVal = getFileType(a.name, a.type)
      bVal = getFileType(b.name, b.type)
    } else {
      aVal = a.size
      bVal = b.size
    }
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'Delete' && selectedFiles.length > 0) {
        e.preventDefault()
        handleBulkDelete()
      }
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setSelectedFiles(filteredFiles.map((f) => f.key))
      }
      if (e.key === 'F2' && selectedFiles.length === 1) {
        e.preventDefault()
        const file = filteredFiles.find((f) => f.key === selectedFiles[0])
        if (file) startRename(file)
      }
      if (e.key === 'Escape') {
        clearSelection()
        setClipboard(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles, filteredFiles])

  const handleCheckboxClick = (
    e: React.MouseEvent | React.ChangeEvent,
    file: FileObject
  ) => {
    e.stopPropagation()
    if ((e as React.MouseEvent).shiftKey && lastSelected) {
      selectRange(lastSelected, file.key, filteredFiles.map((f) => f.key))
    } else {
      toggleFileSelection(file.key)
    }
    setLastSelected(file.key)
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
    try {
      await downloadAsZip(bucket, selectedFiles, 'selected-files.zip')
      toast.success(`Downloaded ${selectedFiles.length} files as ZIP`)
    } catch (error) {
      toast.error('Failed to download files')
      console.error('Download error:', error)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, file: FileObject) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedFiles.includes(file.key)) {
      setSelectedFiles([file.key])
    }
    showContextMenu(e.clientX, e.clientY, file.key)
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

  if (filteredFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {searchTerm ? 'No matching files' : 'No files'}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {searchTerm ? 'Try adjusting your search term.' : 'This folder is empty.'}
        </p>
      </div>
    )
  }

  const allSelected =
    filteredFiles.length > 0 &&
    filteredFiles.every((file) => selectedFiles.includes(file.key))

   // Toolbar
   const Toolbar = () => (
     <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
       <div className="flex items-center space-x-4">
         <label className="flex items-center space-x-2 cursor-pointer">
           <input
             type="checkbox"
             checked={allSelected}
             onChange={(e) => {
               if (e.target.checked) {
                 setSelectedFiles(filteredFiles.map((f) => f.key))
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
           <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
             {selectedFiles.length} selected
           </span>
         )}
       </div>
       <div className="flex flex-wrap items-center gap-2">
         {selectedFiles.length > 0 && (
           <>
             <button
               onClick={handleBulkDelete}
               className="btn btn-outline text-sm text-red-600 hover:text-red-700"
             >
               <TrashIcon className="h-4 w-4 inline mr-1" />
               Delete
             </button>
             <button onClick={handleBulkDownload} className="btn btn-outline text-sm">
               <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
               Download ZIP
             </button>
           </>
         )}
         {clipboard && clipboard.sourceBucket === bucket && (
           <button onClick={handlePaste} className="btn btn-outline text-sm">
             <ClipboardDocumentIcon className="h-4 w-4 inline mr-1" />
             Paste
           </button>
         )}
         <label className="flex items-center space-x-2 cursor-pointer">
           <input
             type="checkbox"
             checked={showHidden}
             onChange={(e) => setShowHidden(e.target.checked)}
             className="rounded"
           />
           <span className="text-sm text-gray-700 dark:text-gray-300">Hidden</span>
         </label>
         <select
           value={filterBy}
           onChange={(e) => setFilterBy(e.target.value)}
           className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
           onChange={(e) => {
             const [by, order] = e.target.value.split('-') as [
               'name' | 'date' | 'size' | 'type',
               'asc' | 'desc'
             ]
             setSort(by, order)
           }}
           className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
           onChange={(e) => setSearchTerm(e.target.value)}
           className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-40"
         />
         <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
           <button
             onClick={() => setViewMode('grid')}
             className={`p-1.5 ${viewMode === 'grid' ? 'bg-primary-100 dark:bg-primary-900 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
             title="Grid View"
           >
             <Squares2X2Icon className="h-4 w-4" />
           </button>
           <button
             onClick={() => setViewMode('list')}
             className={`p-1.5 ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
             title="List View"
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

  // Grid View
  const GridView = () => (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
       {sortedFiles.map((file) => (
         <div
           key={file.key}
           className={`border rounded-lg p-4 cursor-pointer transition-colors group relative ${
             selectedFiles.includes(file.key)
               ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
               : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
           }`}
           onClick={() => handleFileClick(file)}
           onContextMenu={(e) => handleContextMenu(e, file)}
         >
           <div className="flex items-start justify-between mb-3">
             <input
               type="checkbox"
               checked={selectedFiles.includes(file.key)}
               onChange={(e) => handleCheckboxClick(e, file)}
               onClick={(e) => e.stopPropagation()}
               className="rounded"
             />
             <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
               {file.type === 'folder' ? (
                 <button
                   onClick={(e) => {
                     e.stopPropagation()
                     handleDownloadFolder(file)
                   }}
                   className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                   title="Download as ZIP"
                 >
                   <ArrowDownTrayIcon className="h-4 w-4" />
                 </button>
               ) : (
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
           <div className="flex flex-col items-center text-center">
             {getFileIconComponent(file)}
             {renaming === file.key ? (
               <input
                 ref={renameInputRef}
                 value={renameValue}
                 onChange={(e) => setRenameValue(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') handleRenameSubmit(file)
                   if (e.key === 'Escape') setRenaming(null)
                 }}
                 onBlur={() => handleRenameSubmit(file)}
                 onClick={(e) => e.stopPropagation()}
                 className="mt-2 text-sm font-medium text-center w-full border border-primary-500 rounded px-1"
               />
             ) : (
               <h3
                 className="mt-2 text-sm font-medium text-gray-900 dark:text-white truncate w-full"
                 title={file.name}
               >
                 {file.name}
               </h3>
             )}
             <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
               {file.type === 'file' && <span>{formatFileSize(file.size)}</span>}
               <span>{formatDateTime(file.lastModified)}</span>
             </div>
           </div>
         </div>
       ))}
    </div>
  )

  // List View
  const ListView = () => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <div className="w-8"></div>
        <div>Name</div>
        <div>Size</div>
        <div>Type</div>
        <div>Modified</div>
        <div>Actions</div>
      </div>
      {sortedFiles.map((file) => (
         <div
           key={file.key}
           className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 items-center border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer transition-colors ${
             selectedFiles.includes(file.key)
               ? 'bg-primary-50 dark:bg-primary-900/20'
               : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
           }`}
           onClick={() => handleFileClick(file)}
           onContextMenu={(e) => handleContextMenu(e, file)}
         >
           <div className="w-8 flex justify-center">
             <input
               type="checkbox"
               checked={selectedFiles.includes(file.key)}
               onChange={(e) => handleCheckboxClick(e, file)}
               onClick={(e) => e.stopPropagation()}
               className="rounded"
             />
           </div>
           <div className="flex items-center space-x-3 min-w-0">
             {getFileIconComponent(file)}
             {renaming === file.key ? (
               <input
                 ref={renameInputRef}
                 value={renameValue}
                 onChange={(e) => setRenameValue(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') handleRenameSubmit(file)
                   if (e.key === 'Escape') setRenaming(null)
                 }}
                 onBlur={() => handleRenameSubmit(file)}
                 onClick={(e) => e.stopPropagation()}
                 className="text-sm font-medium border border-primary-500 rounded px-1 w-full"
               />
             ) : (
               <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                 {file.name}
               </span>
             )}
           </div>
           <div className="text-sm text-gray-500 dark:text-gray-400 w-24 text-right">
             {file.type === 'file' ? formatFileSize(file.size) : '--'}
           </div>
           <div className="text-sm text-gray-500 dark:text-gray-400 w-24 capitalize">
             {getFileType(file.name, file.type)}
           </div>
           <div className="text-sm text-gray-500 dark:text-gray-400 w-36">
             {formatDateTime(file.lastModified)}
           </div>
           <div className="flex items-center space-x-1 w-40 justify-end">
             {file.type === 'folder' ? (
               <button
                 onClick={(e) => {
                   e.stopPropagation()
                   handleDownloadFolder(file)
                 }}
                 className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                 title="Download as ZIP"
               >
                 <ArrowDownTrayIcon className="h-4 w-4" />
               </button>
             ) : (
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
                 <button
                   onClick={(e) => {
                     e.stopPropagation()
                     startRename(file)
                   }}
                   className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                   title="Rename"
                 >
                   <PencilIcon className="h-4 w-4" />
                 </button>
                 <button
                   onClick={(e) => {
                     e.stopPropagation()
                     handleDuplicate(file)
                   }}
                   className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                   title="Duplicate"
                 >
                   <DocumentDuplicateIcon className="h-4 w-4" />
                 </button>
                 <button
                   onClick={(e) => {
                     e.stopPropagation()
                     handleCopyToClipboard(file)
                   }}
                   className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                   title="Copy"
                 >
                   <ClipboardDocumentIcon className="h-4 w-4" />
                 </button>
                 <button
                   onClick={(e) => {
                     e.stopPropagation()
                     handleCutToClipboard(file)
                   }}
                   className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                   title="Cut"
                 >
                   <ScissorsIcon className="h-4 w-4" />
                 </button>
                 <button
                   onClick={(e) => {
                     e.stopPropagation()
                     handleMove(file)
                   }}
                   className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                   title="Move"
                 >
                   <ArrowRightIcon className="h-4 w-4" />
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
      ))}
    </div>
  )
  
  return (
    <div>
      <Toolbar />
      {viewMode === 'grid' ? <GridView /> : <ListView />}
      <PreviewModal
        file={previewFile}
        bucket={bucket}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  )
 }

export default FileList
