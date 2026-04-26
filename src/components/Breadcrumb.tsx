import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

interface BreadcrumbProps {
  bucket: string
  path: string
  onPathChange: (path: string) => void
}

const Breadcrumb = ({ bucket, path, onPathChange }: BreadcrumbProps) => {
  const pathParts = path.split('/').filter(Boolean)

  const handlePathClick = (index: number) => {
    const newPath = pathParts.slice(0, index + 1).join('/') + '/'
    onPathChange(newPath)
  }

  const handleHomeClick = () => {
    onPathChange('')
  }

  return (
    <nav className="flex items-center space-x-1 text-sm">
      <button
        onClick={handleHomeClick}
        className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <HomeIcon className="h-4 w-4 mr-1" />
        {bucket}
      </button>

      {pathParts.length > 0 && (
        <>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          {pathParts.map((part, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-1" />}
              <button
                onClick={() => handlePathClick(index)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {part}
              </button>
            </div>
          ))}
        </>
      )}
    </nav>
  )
}

export default Breadcrumb