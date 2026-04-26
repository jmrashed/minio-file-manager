import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const Login = () => {
  const [credentials, setCredentials] = useState({
    accessKey: '',
    secretKey: '',
    endpoint: 'localhost',
    port: '9000',
    useSSL: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Store credentials in localStorage
      localStorage.setItem('minio-credentials', JSON.stringify(credentials))
      toast.success('Login successful!')
      navigate('/')
    } catch (error) {
      toast.error('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            MinIO File Manager
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in with your MinIO credentials
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="endpoint" className="sr-only">
                Endpoint
              </label>
              <input
                id="endpoint"
                name="endpoint"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="MinIO Endpoint"
                value={credentials.endpoint}
                onChange={(e) => handleInputChange('endpoint', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="port" className="sr-only">
                Port
              </label>
              <input
                id="port"
                name="port"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Port (default: 9000)"
                value={credentials.port}
                onChange={(e) => handleInputChange('port', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="accessKey" className="sr-only">
                Access Key
              </label>
              <input
                id="accessKey"
                name="accessKey"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Access Key"
                value={credentials.accessKey}
                onChange={(e) => handleInputChange('accessKey', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="secretKey" className="sr-only">
                Secret Key
              </label>
              <input
                id="secretKey"
                name="secretKey"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Secret Key"
                value={credentials.secretKey}
                onChange={(e) => handleInputChange('secretKey', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="useSSL"
              name="useSSL"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              checked={credentials.useSSL}
              onChange={(e) => handleInputChange('useSSL', e.target.checked)}
            />
            <label htmlFor="useSSL" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Use SSL
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login