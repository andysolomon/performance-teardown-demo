import { Dashboard } from './components/Dashboard'
import { useWeather } from './hooks/useWeather'
import './App.css'

function App() {
  const { current, forecast, isLoading, error, source, refetch } = useWeather()

  return <Dashboard current={current} forecast={forecast} isLoading={isLoading} error={error} source={source} onRetry={refetch} />
}

export default App
