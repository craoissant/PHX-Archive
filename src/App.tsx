import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to="/archive" replace />
}

export default App