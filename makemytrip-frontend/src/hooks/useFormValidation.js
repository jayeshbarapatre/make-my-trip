import { useState } from 'react'

export const useFormValidation = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear error on change
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(values)
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const setFieldError = (name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const setFieldValue = (name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldError,
    setFieldValue,
    resetForm,
    getFieldProps: (name) => ({
      name,
      value: values[name] || '',
      onChange: handleChange,
      onBlur: handleBlur
    })
  }
}

export default useFormValidation
