import React from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import { GoongImportPage } from './features/imports'
import AIConfig from './pages/AIConfig'
import Dashboard from './pages/Dashboard'
import Places from './pages/Places'
import Reviews from './pages/Reviews'
import Users from './pages/Users'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="places" element={<Places />} />
        <Route path="users" element={<Users />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="import" element={<GoongImportPage />} />
        <Route path="ai-config" element={<AIConfig />} />
      </Route>
    </Routes>
  )
}

export default App