import { useState, useRef, useEffect } from 'react'
import { useAutocomplete } from '../hooks/useAutocomplete'
import styles from '../styles/AutocompleteInput.module.css'

export const AutocompleteInput = ({
  label,
  placeholder,
  searchFn,
  onSelect,
  value,
  onChange,
  error
}) => {
  const [inputValue, setInputValue] = useState(value || '')
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const {
    suggestions,
    isLoading,
    isOpen,
    selectedIndex,
    debouncedSearch,
    handleKeyDown,
    selectSuggestion,
    closeSuggestions,
    setIsOpen
  } = useAutocomplete(searchFn)

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    onChange?.(val)
    debouncedSearch(val)
  }

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion)
    onSelect?.(suggestion)
    selectSuggestion(suggestion)
  }

  const handleInputKeyDown = (e) => {
    const selected = handleKeyDown(e)
    if (selected && e.key === 'Enter') {
      handleSuggestionClick(selected)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        closeSuggestions()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [closeSuggestions])

  return (
    <div className={styles.container} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          autoComplete="off"
        />
        {isLoading && <span className={styles.spinner}>⟳</span>}
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {isOpen && suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {suggestions.map((suggestion, idx) => (
            <li
              key={idx}
              className={`${styles.suggestion} ${
                idx === selectedIndex ? styles.selected : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      {isOpen && !isLoading && inputValue && suggestions.length === 0 && (
        <div className={styles.noResults}>No results found</div>
      )}
    </div>
  )
}
