import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadFile } from '../services/fileService'
import toast from 'react-hot-toast'

interface UploadParams {
  bucket: string
  files: File[]
  path?: string
}

export const useUpload = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bucket, files, path = '' }: UploadParams) => {
      const uploadPromises = files.map(async (file) => {
        const fileKey = path ? `${path}${file.name}` : file.name

        try {
          await uploadFile(bucket, fileKey, file)
          return fileKey
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          throw error
        }
      })

      const results = await Promise.allSettled(uploadPromises)
      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.filter(result => result.status === 'rejected').length

      if (failed > 0) {
        throw new Error(`Upload completed with ${successful} success and ${failed} failures`)
      }

      return successful
    },
    onSuccess: (data, { bucket, path }) => {
      queryClient.invalidateQueries({ queryKey: ['files', bucket, path] })
      toast.success(`Successfully uploaded ${data} file${data !== 1 ? 's' : ''}`)
    },
    onError: (error) => {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    },
  })
}