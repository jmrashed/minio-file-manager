import { format, formatDistanceToNow } from 'date-fns'
import bytes from 'bytes'

export const formatFileSize = (size: number): string => {
  return bytes(size, { unitSeparator: ' ' }) || `${size} B`
}

export const formatDate = (date: Date): string => {
  return format(date, 'MMM dd, yyyy')
}

export const formatDateTime = (date: Date): string => {
  return format(date, 'MMM dd, yyyy HH:mm')
}

export const formatRelativeTime = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true })
}

export const formatFileName = (name: string, maxLength: number = 30): string => {
  if (name.length <= maxLength) return name
  const extension = name.split('.').pop()
  const nameWithoutExt = name.slice(0, -(extension?.length || 0) - 1)
  const truncated = nameWithoutExt.slice(0, maxLength - 3 - (extension?.length || 0) - 1)
  return `${truncated}...${extension ? `.${extension}` : ''}`
}

export const getFileIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()

  const iconMap: Record<string, string> = {
    // Images
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    svg: 'image',
    webp: 'image',
    // Documents
    pdf: 'file-text',
    doc: 'file-text',
    docx: 'file-text',
    txt: 'file-text',
    md: 'file-text',
    // Videos
    mp4: 'video',
    avi: 'video',
    mkv: 'video',
    mov: 'video',
    // Audio
    mp3: 'music',
    wav: 'music',
    flac: 'music',
    // Archives
    zip: 'archive',
    rar: 'archive',
    tar: 'archive',
    gz: 'archive',
    '7z': 'archive',
    // Code
    js: 'code',
    ts: 'code',
    jsx: 'code',
    tsx: 'code',
    html: 'code',
    css: 'code',
    json: 'code',
    xml: 'code',
  }

  return iconMap[extension || ''] || 'file'
}

export const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp']
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? imageExtensions.includes(extension) : false
}

export const isVideoFile = (fileName: string): boolean => {
  const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? videoExtensions.includes(extension) : false
}

export const isAudioFile = (fileName: string): boolean => {
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma']
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? audioExtensions.includes(extension) : false
}

export const isTextFile = (fileName: string): boolean => {
  const textExtensions = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx']
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? textExtensions.includes(extension) : false
}