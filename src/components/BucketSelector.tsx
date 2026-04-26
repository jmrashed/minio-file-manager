import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { BucketInfo } from '../services/fileService'

interface BucketSelectorProps {
  buckets: BucketInfo[]
  currentBucket: string
  onBucketChange: (bucket: string) => void
  loading: boolean
}

const BucketSelector = ({ buckets, currentBucket, onBucketChange, loading }: BucketSelectorProps) => {
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
      </div>
    )
  }

  if (buckets.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        No buckets available
      </div>
    )
  }

  return (
    <div className="relative">
      <select
        value={currentBucket}
        onChange={(e) => onBucketChange(e.target.value)}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {buckets.map((bucket) => (
          <option key={bucket.name} value={bucket.name}>
            {bucket.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

export default BucketSelector