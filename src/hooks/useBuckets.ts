import { useQuery } from '@tanstack/react-query'
import { listBuckets } from '../services/fileService'

export const useBuckets = () => {
  return useQuery({
    queryKey: ['buckets'],
    queryFn: listBuckets,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('InvalidAccessKeyId')) {
        return false
      }
      return failureCount < 3
    },
  })
}