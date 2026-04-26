import { S3Client } from '@aws-sdk/client-s3'

let s3Client: S3Client | null = null

export const getS3Client = (): S3Client => {
  if (!s3Client) {
    const credentials = JSON.parse(localStorage.getItem('minio-credentials') || '{}')

    s3Client = new S3Client({
      endpoint: `${credentials.useSSL ? 'https' : 'http'}://${credentials.endpoint}:${credentials.port}`,
      region: 'us-east-1', // MinIO doesn't use regions, but this is required
      credentials: {
        accessKeyId: credentials.accessKey,
        secretAccessKey: credentials.secretKey,
      },
      forcePathStyle: true, // Required for MinIO
    })
  }

  return s3Client
}

export const resetS3Client = () => {
  s3Client = null
}

export const getCredentials = () => {
  return JSON.parse(localStorage.getItem('minio-credentials') || '{}')
}