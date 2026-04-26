import { useInfiniteQuery } from '@tanstack/react-query'
import { listObjects, FileObject } from '../services/fileService'

export const useFiles = (bucket: string, path: string = '') => {
  const query = useInfiniteQuery({
    queryKey: ['files', bucket, path],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      if (!bucket) {
        return { objects: [] as FileObject[], nextContinuationToken: undefined as string | undefined }
      }

      return listObjects(bucket, path, pageParam)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextContinuationToken,
    enabled: !!bucket,
    staleTime: 30 * 1000,
  })

  return {
    ...query,
    files: query.data?.pages.flatMap((page) => page.objects) ?? [],
  }
}
