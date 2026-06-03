import { useToastContext } from '../context/ToastContext'

export const useToast = () => {
  const toastCtx = useToastContext()
  return {
    success: (message, title = 'Congratulations', options = {}) => toastCtx.success(message, title, options),
    error: (message, title = 'Error', options = {}) => toastCtx.error(message, title, options),
    warning: (message, title = 'Warning', options = {}) => toastCtx.warning(message, title, options),
    info: (message, title = 'Info', options = {}) => toastCtx.info(message, title, options),
    showToast: (options) => toastCtx.showToast(options),
    dismiss: (id) => toastCtx.removeToast(id)
  }
}


