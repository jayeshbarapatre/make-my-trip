import { useState, useEffect } from 'react'

// Coordinate map for popular cities
const COORDINATES = {
  'goa': { lat: 15.4989, lon: 73.8278 },
  'manali': { lat: 32.2396, lon: 77.1887 },
  'jaipur': { lat: 26.9124, lon: 75.7873 },
  'kerala': { lat: 9.9312, lon: 76.2673 },
  'kochi': { lat: 9.9312, lon: 76.2673 },
  'coorg': { lat: 12.3375, lon: 75.7378 },
  'udaipur': { lat: 24.5854, lon: 73.7125 },
  'ladakh': { lat: 34.1526, lon: 77.5771 },
  'leh': { lat: 34.1526, lon: 77.5771 },
  'delhi': { lat: 28.6139, lon: 77.2090 },
  'new delhi': { lat: 28.6139, lon: 77.2090 },
  'mumbai': { lat: 19.0760, lon: 72.8777 },
  'bengaluru': { lat: 12.9716, lon: 77.5946 },
  'bangalore': { lat: 12.9716, lon: 77.5946 },
  'chennai': { lat: 13.0827, lon: 80.2707 },
  'howrah': { lat: 22.5958, lon: 88.2636 },
  'pune': { lat: 18.5204, lon: 73.8567 },
  'lucknow': { lat: 26.8467, lon: 80.9462 }
}

export function useWeather(cityName) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cityName) return

    const key = cityName.toLowerCase().trim()
    const coords = COORDINATES[key]
    if (!coords) return

    let isMounted = true
    setLoading(true)

    // Call the Open-Meteo free public API
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data?.current_weather) {
          const temp = Math.round(data.current_weather.temperature)
          const code = data.current_weather.weathercode
          
          // Basic weather code map to descriptions & emojis
          let desc = 'Clear'
          let emoji = '☀️'
          if (code >= 1 && code <= 3) { desc = 'Partly Cloudy'; emoji = '⛅'; }
          else if (code >= 45 && code <= 48) { desc = 'Foggy'; emoji = '🌫️'; }
          else if (code >= 51 && code <= 67) { desc = 'Rainy'; emoji = '🌧️'; }
          else if (code >= 71 && code <= 77) { desc = 'Snowy'; emoji = '❄️'; }
          else if (code >= 80 && code <= 82) { desc = 'Showers'; emoji = '🌦️'; }
          else if (code >= 95) { desc = 'Thunderstorm'; emoji = '⛈️'; }

          setWeather({ temp, desc, emoji })
        }
      })
      .catch(err => console.error('Error fetching weather:', err))
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [cityName])

  return { weather, loading }
}
