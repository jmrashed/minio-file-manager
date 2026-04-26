import {
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getS3Client } from './minioClient'

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
  const command = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: keys.map(key => ({ Key: key })),
    },
  })
  await client.send(command)
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