import toast from 'react-hot-toast'

export const useToast = () => {
  return {
    success: (message) => toast.success(message),
    error: (message) => toast.error(message),
    loading: (message) => toast.loading(message),
    dismiss: (id) => toast.dismiss(id),
    promise: (promise, msgs) => toast.promise(promise, msgs),
    custom: (message, options) => toast.custom(message, options)
  }
}

