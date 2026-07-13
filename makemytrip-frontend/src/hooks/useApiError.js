import { useState } from 'react'
import toast from 'react-hot-toast'

export const useApiError = () => {
  const [error, setError] = useState(null)

  const handleError = (err) => {
    let message = 'An error occurred. Please try again.'

    // Handle different error types
    if (err.response?.data?.message) {
      message = err.response.data.message
    } else if (err.message) {
      message = err.message
    }

    // Show toast notification
    toast.error(message)

    // Store error state
    setError({
      message,
      status: err.response?.status,
      data: err.response?.data
    })

    return error
  }

  const clearError = () => {
    setError(null)
  }

  return {
    error,
    handleError,
    clearError,
    hasError: !!error
  }
}

export default useApiError
