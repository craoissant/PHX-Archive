  import { createBrowserRouter } from 'react-router-dom'
  import App from './App'
  import Login from './pages/Login'
  import Archive from './pages/archive'
  import ArchivedRecords from './pages/ArchivedRecords'

  import ProtectedRoute from './components/ProtectedRoute'

  export const router = createBrowserRouter([
    {
      path: '/',
      element: <App />,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/archive',
          element: <Archive />,
        },
        {
          path: '/archive/archived',
          element: <ArchivedRecords />,
        },
  
      ],
    },
  ])