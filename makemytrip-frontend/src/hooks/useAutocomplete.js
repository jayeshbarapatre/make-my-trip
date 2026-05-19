import { useState, useCallback, useRef, useEffect } from 'react'

export const useAutocomplete = (searchFn, debounceMs = 300) => {
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceTimer = useRef(null)

  const search = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setSuggestions([])
      setSelectedIndex(-1)
      return
    }

    setIsLoading(true)
    try {
      const result = await searchFn(query)
      setSuggestions(result || [])
      setSelectedIndex(-1)
      setIsOpen(true)
    } catch (err) {
      console.error('Autocomplete error:', err)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [searchFn])

  const debouncedSearch = useCallback((query) => {
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => search(query), debounceMs)
  }, [search, debounceMs])

  const handleKeyDown = useCallback((e) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          return suggestions[selectedIndex]
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
      default:
        break
    }
  }, [isOpen, suggestions, selectedIndex])

  const selectSuggestion = useCallback((suggestion) => {
    setSuggestions([])
    setIsOpen(false)
    setSelectedIndex(-1)
    return suggestion
  }, [])

  const closeSuggestions = useCallback(() => {
    setIsOpen(false)
    setSuggestions([])
  }, [])

  return {
    suggestions,
    isLoading,
    isOpen,
    selectedIndex,
    debouncedSearch,
    handleKeyDown,
    selectSuggestion,
    closeSuggestions,
    setSuggestions,
    setIsOpen
  }
}

