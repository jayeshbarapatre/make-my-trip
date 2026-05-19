import { useState } from 'react'
import { AutocompleteInput } from './AutocompleteInput'
import { flightService } from '../services/flightService'
import styles from '../styles/FlightForm.module.css'

export const FlightForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    airline: '',
    flightNumber: '',
    aircraft: '',
    departureCity: '',
    departureAirport: '',
    arrivalCity: '',
    arrivalAirport: '',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: ''
  })

  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.airline.trim()) newErrors.airline = 'Airline is required'
    if (!formData.flightNumber.trim()) newErrors.flightNumber = 'Flight number is required'
    if (!formData.aircraft.trim()) newErrors.aircraft = 'Aircraft type is required'
    if (!formData.departureCity.trim()) newErrors.departureCity = 'Departure city is required'
    if (!formData.departureAirport.trim()) newErrors.departureAirport = 'Departure airport is required'
    if (!formData.arrivalCity.trim()) newErrors.arrivalCity = 'Arrival city is required'
    if (!formData.arrivalAirport.trim()) newErrors.arrivalAirport = 'Arrival airport is required'
    if (!formData.departureDate) newErrors.departureDate = 'Departure date is required'
    if (!formData.departureTime) newErrors.departureTime = 'Departure time is required'
    if (!formData.arrivalDate) newErrors.arrivalDate = 'Arrival date is required'
    if (!formData.arrivalTime) newErrors.arrivalTime = 'Arrival time is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit?.(formData)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.title}>
        <h2>Add New Flight</h2>
        <p>Fill in the flight details below</p>
      </div>

      <div className={styles.grid}>
        {/* Row 1: Airline, Flight Number, Aircraft */}
        <AutocompleteInput
          label="Airline"
          placeholder="e.g., Air India, IndiGo..."
          searchFn={flightService.getAirlines}
          onSelect={(val) => handleInputChange('airline', val)}
          onChange={(val) => handleInputChange('airline', val)}
          value={formData.airline}
          error={errors.airline}
        />

        <div className={styles.field}>
          <label className={styles.label}>Flight Number</label>
          <input
            type="text"
            placeholder="e.g., AI101, 6E102"
            value={formData.flightNumber}
            onChange={(e) => handleInputChange('flightNumber', e.target.value)}
            className={`${styles.input} ${errors.flightNumber ? styles.inputError : ''}`}
          />
          {errors.flightNumber && <span className={styles.error}>{errors.flightNumber}</span>}
        </div>

        <AutocompleteInput
          label="Aircraft"
          placeholder="e.g., Boeing 737..."
          searchFn={flightService.getAircrafts}
          onSelect={(val) => handleInputChange('aircraft', val)}
          onChange={(val) => handleInputChange('aircraft', val)}
          value={formData.aircraft}
          error={errors.aircraft}
        />
      </div>

      <div className={styles.grid}>
        {/* Row 2: Departure City & Airport */}
        <AutocompleteInput
          label="Departure City"
          placeholder="e.g., Delhi, Mumbai..."
          searchFn={flightService.getCities}
          onSelect={(val) => handleInputChange('departureCity', val)}
          onChange={(val) => handleInputChange('departureCity', val)}
          value={formData.departureCity}
          error={errors.departureCity}
        />

        <AutocompleteInput
          label="Departure Airport"
          placeholder="e.g., DEL, BOM..."
          searchFn={flightService.getAirports}
          onSelect={(val) => handleInputChange('departureAirport', val)}
          onChange={(val) => handleInputChange('departureAirport', val)}
          value={formData.departureAirport}
          error={errors.departureAirport}
        />
      </div>

      <div className={styles.grid}>
        {/* Row 3: Arrival City & Airport */}
        <AutocompleteInput
          label="Arrival City"
          placeholder="e.g., Bangalore, Chennai..."
          searchFn={flightService.getCities}
          onSelect={(val) => handleInputChange('arrivalCity', val)}
          onChange={(val) => handleInputChange('arrivalCity', val)}
          value={formData.arrivalCity}
          error={errors.arrivalCity}
        />

        <AutocompleteInput
          label="Arrival Airport"
          placeholder="e.g., BLR, MAA..."
          searchFn={flightService.getAirports}
          onSelect={(val) => handleInputChange('arrivalAirport', val)}
          onChange={(val) => handleInputChange('arrivalAirport', val)}
          value={formData.arrivalAirport}
          error={errors.arrivalAirport}
        />
      </div>

      <div className={styles.grid}>
        {/* Row 4: Departure Date & Time */}
        <div className={styles.field}>
          <label className={styles.label}>Departure Date</label>
          <input
            type="date"
            value={formData.departureDate}
            onChange={(e) => handleInputChange('departureDate', e.target.value)}
            className={`${styles.input} ${errors.departureDate ? styles.inputError : ''}`}
          />
          {errors.departureDate && <span className={styles.error}>{errors.departureDate}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Departure Time</label>
          <input
            type="time"
            value={formData.departureTime}
            onChange={(e) => handleInputChange('departureTime', e.target.value)}
            className={`${styles.input} ${errors.departureTime ? styles.inputError : ''}`}
          />
          {errors.departureTime && <span className={styles.error}>{errors.departureTime}</span>}
        </div>
      </div>

      <div className={styles.grid}>
        {/* Row 5: Arrival Date & Time */}
        <div className={styles.field}>
          <label className={styles.label}>Arrival Date</label>
          <input
            type="date"
            value={formData.arrivalDate}
            onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
            className={`${styles.input} ${errors.arrivalDate ? styles.inputError : ''}`}
          />
          {errors.arrivalDate && <span className={styles.error}>{errors.arrivalDate}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Arrival Time</label>
          <input
            type="time"
            value={formData.arrivalTime}
            onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
            className={`${styles.input} ${errors.arrivalTime ? styles.inputError : ''}`}
          />
          {errors.arrivalTime && <span className={styles.error}>{errors.arrivalTime}</span>}
        </div>
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={loading}
      >
        {loading ? 'Adding Flight...' : 'Add Flight'}
      </button>
    </form>
  )
}
