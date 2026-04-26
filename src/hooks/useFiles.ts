import { useQuery } from '@tanstack/react-query'
import { listObjects, FileObject } from '../services/fileService'

export const useFiles = (bucket: string, path: string = '') => {
  return useQuery({
    queryKey: ['files', bucket, path],
    queryFn: async (): Promise<FileObject[]> => {
      if (!bucket) return []
      const response = await listObjects(bucket, path)
      return response.objects
    },
    enabled: !!bucket,
    staleTime: 30 * 1000, // 30 seconds
  })
}