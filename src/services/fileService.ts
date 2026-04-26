import {
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getS3Client } from './minioClient'
import JSZip from 'jszip'

export interface FileObject {
  key: string
  name: string
  size: number
  lastModified: Date
  type: 'file' | 'folder'
  contentType?: string
}

export interface BucketInfo {
  name: string
  creationDate?: Date
}

interface TransferProgress {
  loaded: number
  total: number
  speed: number
  progress: number
}

// Bucket operations
export const listBuckets = async (): Promise<BucketInfo[]> => {
  const client = getS3Client()
  const command = new ListBucketsCommand({})
  const response = await client.send(command)

  return (response.Buckets || []).map(bucket => ({
    name: bucket.Name!,
    creationDate: bucket.CreationDate,
  }))
}

export const createBucket = async (bucketName: string): Promise<void> => {
  const client = getS3Client()
  const command = new CreateBucketCommand({ Bucket: bucketName })
  await client.send(command)
}

export const deleteBucket = async (bucketName: string): Promise<void> => {
  const client = getS3Client()
  const command = new DeleteBucketCommand({ Bucket: bucketName })
  await client.send(command)
}

// File operations
export const listObjects = async (
  bucket: string,
  prefix: string = '',
  continuationToken?: string
): Promise<{ objects: FileObject[], nextContinuationToken?: string }> => {
  const client = getS3Client()
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    Delimiter: '/', // Use delimiter to get folder structure
    ContinuationToken: continuationToken,
  })

  const response = await client.send(command)

  const folders: FileObject[] = (response.CommonPrefixes || []).map(prefix => ({
    key: prefix.Prefix!,
    name: prefix.Prefix!.split('/').slice(-2)[0] + '/',
    size: 0,
    lastModified: new Date(),
    type: 'folder' as const,
  }))

  const files: FileObject[] = (response.Contents || [])
    .filter(obj => obj.Key !== prefix) // Exclude the current directory
    .map(obj => ({
      key: obj.Key!,
      name: obj.Key!.split('/').pop() || '',
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date(),
      type: 'file' as const,
      contentType: obj.Key!.split('.').pop(),
    }))

  const objects = [...folders, ...files]

  return {
    objects,
    nextContinuationToken: response.NextContinuationToken,
  }
}

export const uploadFile = async (
  bucket: string,
  key: string,
  file: File
): Promise<void> => {
  const client = getS3Client()

  // Convert File to Uint8Array to ensure compatibility with AWS SDK
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  // For large files, we'd use multipart upload, but for simplicity, we'll use PutObject
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: uint8Array,
    ContentType: file.type,
  })

  await client.send(command)
}

const listAllObjectKeys = async (bucket: string, prefix: string): Promise<string[]> => {
  const client = getS3Client()
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    for (const obj of response.Contents || []) {
      if (obj.Key) {
        keys.push(obj.Key)
      }
    }

    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return keys
}

export const deleteObject = async (bucket: string, key: string): Promise<void> => {
  const client = getS3Client()
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  await client.send(command)
}

export const deleteObjects = async (bucket: string, keys: string[]): Promise<void> => {
  const client = getS3Client()
  const allKeysToDelete: string[] = []

  for (const key of keys) {
    if (key.endsWith('/')) {
      // It's a folder, get all objects with prefix
      const objects = await listAllObjectKeys(bucket, key)
      allKeysToDelete.push(...objects)
    } else {
      allKeysToDelete.push(key)
    }
  }

  if (allKeysToDelete.length > 0) {
    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: allKeysToDelete.map(key => ({ Key: key })),
      },
    })
    await client.send(command)
  }
}

export const createFolder = async (bucket: string, key: string): Promise<void> => {
  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: '', // Empty body for folder
  })
  await client.send(command)
}

export const createEmptyFile = async (bucket: string, key: string): Promise<void> => {
  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: '',
  })
  await client.send(command)
}

export const copyFile = async (bucket: string, sourceKey: string, destKey: string): Promise<void> => {
  const client = getS3Client()
  const command = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${sourceKey}`,
    Key: destKey,
  })
  await client.send(command)
}

export const renameFile = async (bucket: string, oldKey: string, newKey: string): Promise<void> => {
  const client = getS3Client()

  // Copy to new key
  const copyCommand = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${oldKey}`,
    Key: newKey,
  })
  await client.send(copyCommand)

  // Delete old key
  await deleteObject(bucket, oldKey)
}

// Pre-signed URLs
export const getPresignedUploadUrl = async (
  bucket: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn })
}

export const getPresignedDownloadUrl = async (
  bucket: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const client = getS3Client()
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn })
}

export const getObjectUrl = (bucket: string, key: string): string => {
  const credentials = JSON.parse(localStorage.getItem('minio-credentials') || '{}')
  const protocol = credentials.useSSL ? 'https' : 'http'
  return `${protocol}://${credentials.endpoint}:${credentials.port}/${bucket}/${key}`
}

const fetchBlobWithProgress = async (
  url: string,
  onProgress?: (progress: TransferProgress) => void
): Promise<Blob> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`)
  }

  if (!response.body) {
    return response.blob()
  }

  const total = Number(response.headers.get('content-length') || 0)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  const startedAt = Date.now()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    if (value) {
      chunks.push(value)
      loaded += value.length
      const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.1)
      const speed = loaded / elapsedSeconds
      onProgress?.({
        loaded,
        total,
        speed,
        progress: total > 0 ? Math.round((loaded / total) * 100) : 0,
      })
    }
  }

  return new Blob(chunks.map((chunk) => chunk.slice().buffer))
}

export const fetchTextFileContent = async (bucket: string, key: string): Promise<string> => {
  const url = await getPresignedDownloadUrl(bucket, key)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to load text preview (${response.status})`)
  }

  return response.text()
}

export const downloadFileWithProgress = async (
  bucket: string,
  key: string,
  fileName: string,
  onProgress?: (progress: TransferProgress) => void
): Promise<void> => {
  const url = await getPresignedDownloadUrl(bucket, key)
  const blob = await fetchBlobWithProgress(url, onProgress)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

export const downloadAsZip = async (
  bucket: string,
  keys: string[],
  zipName: string,
  onProgress?: (progress: TransferProgress) => void
): Promise<void> => {
  const zip = new JSZip()
  const totalFiles = keys.length
  let completedFiles = 0

  for (const key of keys) {
    const url = await getPresignedDownloadUrl(bucket, key)
    const blob = await fetchBlobWithProgress(url)
    const fileName = key.split('/').pop() || key
    zip.file(fileName, blob)
    completedFiles += 1
    onProgress?.({
      loaded: completedFiles,
      total: totalFiles,
      speed: 0,
      progress: Math.round((completedFiles / Math.max(totalFiles, 1)) * 100),
    })
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(zipBlob)
  link.download = zipName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

export const downloadFolderAsZip = async (
  bucket: string,
  folderKey: string,
  onProgress?: (progress: TransferProgress) => void
): Promise<void> => {
  const objects = await listAllObjectKeys(bucket, folderKey)
  const folderName = folderKey.split('/').slice(-2)[0] || 'folder'
  await downloadAsZip(bucket, objects, `${folderName}.zip`, onProgress)
}
