import AIConfig from '@/pages/AIConfig'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Places from '@/pages/Places'
import Reviews from '@/pages/Reviews'
import Users from '@/pages/Users'
import { Route, Routes } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/places" element={<Places />} />
        <Route path="/users" element={<Users />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/ai-config" element={<AIConfig />} />
      </Routes>
    </div>
  )
}

export default App