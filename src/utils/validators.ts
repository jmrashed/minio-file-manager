export const validateBucketName = (name: string): { isValid: boolean; error?: string } => {
  if (!name) {
    return { isValid: false, error: 'Bucket name is required' }
  }

  if (name.length < 3 || name.length > 63) {
    return { isValid: false, error: 'Bucket name must be between 3 and 63 characters' }
  }

  // Bucket names must be lowercase
  if (name !== name.toLowerCase()) {
    return { isValid: false, error: 'Bucket name must be lowercase' }
  }

  // Bucket names must start and end with a letter or number
  if (!/^[a-z0-9]/.test(name) || !/[a-z0-9]$/.test(name)) {
    return { isValid: false, error: 'Bucket name must start and end with a letter or number' }
  }

  // Bucket names can only contain letters, numbers, hyphens, and periods
  if (!/^[a-z0-9.-]+$/.test(name)) {
    return { isValid: false, error: 'Bucket name can only contain letters, numbers, hyphens, and periods' }
  }

  // Bucket names cannot contain two consecutive periods
  if (/\.\./.test(name)) {
    return { isValid: false, error: 'Bucket name cannot contain two consecutive periods' }
  }

  // Bucket names cannot be formatted as IP addresses
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(name)) {
    return { isValid: false, error: 'Bucket name cannot be formatted as an IP address' }
  }

  return { isValid: true }
}

export const validateFileName = (name: string): { isValid: boolean; error?: string } => {
  if (!name) {
    return { isValid: false, error: 'File name is required' }
  }

  if (name.length > 1024) {
    return { isValid: false, error: 'File name is too long (max 1024 characters)' }
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(name)) {
    return { isValid: false, error: 'File name contains invalid characters' }
  }

  return { isValid: true }
}

export const validateCredentials = (credentials: {
  endpoint: string
  port: string
  accessKey: string
  secretKey: string
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  if (!credentials.endpoint) {
    errors.endpoint = 'Endpoint is required'
  } else if (!/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/.test(credentials.endpoint)) {
    errors.endpoint = 'Invalid endpoint format'
  }

  if (!credentials.port) {
    errors.port = 'Port is required'
  } else {
    const portNum = parseInt(credentials.port)
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      errors.port = 'Port must be a number between 1 and 65535'
    }
  }

  if (!credentials.accessKey) {
    errors.accessKey = 'Access key is required'
  }

  if (!credentials.secretKey) {
    errors.secretKey = 'Secret key is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}