import { useState, useEffect, useRef } from 'react'
import { flightService } from '../../services/flightService'
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

    debounceRef.current = setTimeout(async () => {
      if (val.trim() === '') {
        setSuggestions([])
        setShowDropdown(false)
        return
      }

      if (cache[val]) {
        setSuggestions(cache[val])
      } else {
        try {
          let results = [];
          switch(type) {
            case 'airline': results = await flightService.getAirlines(val); break;
            case 'airport': results = await flightService.getAirports(val); break;
            case 'city': results = await flightService.getCities(val); break;
            case 'aircraft': results = await flightService.getAircrafts(val); break;
            case 'flightNumber': results = await flightService.getFlightNumbers(val); break;
            default: results = [];
          }
          const items = Array.isArray(results)
            ? results.map(item => typeof item === 'string' ? { name: item, code: item } : item)
            : [];
          setSuggestions(items)
          setCache(prev => ({ ...prev, [val]: items }))
        } catch (err) {
          console.error('Autocomplete error:', err)
          setSuggestions([])
        }
      }

      setShowDropdown(true)
    }, 300)
  }

  const handleSelect = (suggestion) => {
    const displayValue = suggestion.name

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
              return (
                <div
                  key={`${type}-${index}`}
                  className={`autocomplete-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                  onClick={() => handleSelect(suggestion)}
                >
                  {suggestion.name}
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
