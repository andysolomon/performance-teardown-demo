import { useMemo } from 'react'
import './WeatherBackground.css'

interface WeatherBackgroundProps {
  temperature: number | null
  conditions: string | null
}

interface WeatherTheme {
  gradient: string
  blobColors: [string, string, string]
  particleClass: string
}

function getWeatherTheme(temp: number | null, conditions: string | null): WeatherTheme {
  const cond = (conditions || '').toLowerCase()

  // Condition-based themes
  if (cond.includes('snow') || cond.includes('sleet') || cond.includes('blizzard')) {
    return {
      gradient: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 30%, #9fa8da 60%, #7986cb 100%)',
      blobColors: ['rgba(200, 210, 240, 0.6)', 'rgba(170, 190, 230, 0.5)', 'rgba(220, 230, 250, 0.4)'],
      particleClass: 'weather-snow',
    }
  }

  if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) {
    return {
      gradient: 'linear-gradient(135deg, #37474f 0%, #455a64 30%, #546e7a 60%, #607d8b 100%)',
      blobColors: ['rgba(100, 140, 180, 0.5)', 'rgba(80, 120, 170, 0.4)', 'rgba(60, 100, 160, 0.5)'],
      particleClass: 'weather-rain',
    }
  }

  if (cond.includes('thunder') || cond.includes('storm')) {
    return {
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)',
      blobColors: ['rgba(80, 60, 140, 0.5)', 'rgba(50, 50, 120, 0.4)', 'rgba(100, 80, 160, 0.5)'],
      particleClass: 'weather-storm',
    }
  }

  if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) {
    return {
      gradient: 'linear-gradient(135deg, #cfd8dc 0%, #b0bec5 30%, #90a4ae 60%, #78909c 100%)',
      blobColors: ['rgba(200, 210, 220, 0.6)', 'rgba(180, 195, 210, 0.5)', 'rgba(210, 220, 230, 0.4)'],
      particleClass: 'weather-fog',
    }
  }

  if (cond.includes('cloud') || cond.includes('overcast')) {
    return {
      gradient: 'linear-gradient(135deg, #78909c 0%, #90a4ae 30%, #b0bec5 60%, #90a4ae 100%)',
      blobColors: ['rgba(160, 180, 200, 0.5)', 'rgba(140, 165, 190, 0.4)', 'rgba(180, 195, 210, 0.5)'],
      particleClass: 'weather-cloudy',
    }
  }

  // Temperature-based themes for clear/sunny/partly cloudy
  if (temp !== null) {
    if (temp >= 95) {
      // Extreme heat
      return {
        gradient: 'linear-gradient(135deg, #ff6f00 0%, #ff8f00 25%, #ffa000 50%, #e65100 100%)',
        blobColors: ['rgba(255, 140, 0, 0.5)', 'rgba(255, 100, 0, 0.4)', 'rgba(255, 170, 50, 0.5)'],
        particleClass: 'weather-hot',
      }
    }
    if (temp >= 80) {
      // Hot / warm
      return {
        gradient: 'linear-gradient(135deg, #ff9800 0%, #ffc107 30%, #ffca28 60%, #ff9800 100%)',
        blobColors: ['rgba(255, 180, 50, 0.5)', 'rgba(255, 200, 80, 0.4)', 'rgba(255, 160, 30, 0.5)'],
        particleClass: 'weather-warm',
      }
    }
    if (temp >= 60) {
      // Pleasant
      return {
        gradient: 'linear-gradient(135deg, #42a5f5 0%, #66bb6a 30%, #81c784 60%, #42a5f5 100%)',
        blobColors: ['rgba(100, 180, 240, 0.5)', 'rgba(120, 200, 150, 0.4)', 'rgba(80, 160, 220, 0.5)'],
        particleClass: 'weather-pleasant',
      }
    }
    if (temp >= 40) {
      // Cool
      return {
        gradient: 'linear-gradient(135deg, #5c6bc0 0%, #7986cb 30%, #64b5f6 60%, #5c6bc0 100%)',
        blobColors: ['rgba(100, 120, 200, 0.5)', 'rgba(130, 150, 220, 0.4)', 'rgba(80, 100, 180, 0.5)'],
        particleClass: 'weather-cool',
      }
    }
    // Cold
    return {
      gradient: 'linear-gradient(135deg, #283593 0%, #1565c0 30%, #1976d2 60%, #283593 100%)',
      blobColors: ['rgba(60, 80, 170, 0.5)', 'rgba(40, 60, 150, 0.4)', 'rgba(80, 100, 190, 0.5)'],
      particleClass: 'weather-cold',
    }
  }

  // Default fallback
  return {
    gradient: 'linear-gradient(135deg, #42a5f5 0%, #66bb6a 30%, #81c784 60%, #42a5f5 100%)',
    blobColors: ['rgba(100, 180, 240, 0.5)', 'rgba(120, 200, 150, 0.4)', 'rgba(80, 160, 220, 0.5)'],
    particleClass: 'weather-pleasant',
  }
}

export function WeatherBackground({ temperature, conditions }: WeatherBackgroundProps) {
  const theme = useMemo(() => getWeatherTheme(temperature, conditions), [temperature, conditions])

  return (
    <div className={`weather-bg ${theme.particleClass}`} style={{ background: theme.gradient }}>
      <div className="weather-bg-blob blob-1" style={{ background: theme.blobColors[0] }} />
      <div className="weather-bg-blob blob-2" style={{ background: theme.blobColors[1] }} />
      <div className="weather-bg-blob blob-3" style={{ background: theme.blobColors[2] }} />
      <div className="weather-bg-noise" />
    </div>
  )
}
