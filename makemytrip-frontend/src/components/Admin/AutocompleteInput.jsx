import { useState, useEffect, useRef } from 'react'
import { getAutocompleteSuggestions } from '../../data/autocompleteData'
import './AutocompleteInput.css'

const AutocompleteInput = ({ type, placeholder, value, onChange, onSelect, label, required = false }) => {
  const [input, setInput] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [cache, setCache] = useState({})
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const debounceRef = useRef(null)

  const handleInputChange = (e) => {
    const val = e.target.value
    setInput(val)
    onChange?.(val)
    setHighlightedIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      if (val.trim() === '') {
        setSuggestions([])
        setShowDropdown(false)
        return
      }

      if (cache[val]) {
        setSuggestions(cache[val])
      } else {
        const results = getAutocompleteSuggestions(type, val)
        setSuggestions(results)
        setCache(prev => ({ ...prev, [val]: results }))
      }

      setShowDropdown(true)
    }, 300)
  }

  const handleSelect = (suggestion) => {
    const displayValue = type === 'city' ? `${suggestion.name} (${suggestion.code})` :
                        type === 'airport' ? `${suggestion.code} - ${suggestion.name}` :
                        type === 'airline' ? `${suggestion.name} (${suggestion.code})` :
                        type === 'aircraft' ? suggestion.name :
                        type === 'flightNumber' ? `${suggestion.code}` : suggestion.name

    setInput(displayValue)
    onChange?.(displayValue)
    onSelect?.(suggestion)
    setSuggestions([])
    setShowDropdown(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        break
      default:
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="autocomplete-wrapper">
      {label && <label className="autocomplete-label">{label} {required && <span>*</span>}</label>}
      <div className="autocomplete-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="autocomplete-input"
          placeholder={placeholder}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => input && suggestions.length > 0 && setShowDropdown(true)}
          autoComplete="off"
        />
        {showDropdown && suggestions.length > 0 && (
          <div ref={dropdownRef} className="autocomplete-dropdown">
            {suggestions.map((suggestion, index) => {
              const displayText = type === 'city' ? `${suggestion.name} (${suggestion.code})` :
                                 type === 'airport' ? `${suggestion.code} - ${suggestion.name}` :
                                 type === 'airline' ? `${suggestion.name} (${suggestion.code})` :
                                 type === 'aircraft' ? suggestion.name :
                                 type === 'flightNumber' ? suggestion.name : suggestion.name

              return (
                <div
                  key={`${type}-${index}`}
                  className={`autocomplete-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                  onClick={() => handleSelect(suggestion)}
                >
                  {displayText}
                </div>
              )
            })}
          </div>
        )}
        {showDropdown && input && suggestions.length === 0 && (
          <div ref={dropdownRef} className="autocomplete-dropdown">
            <div className="autocomplete-no-results">No results found</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AutocompleteInput
