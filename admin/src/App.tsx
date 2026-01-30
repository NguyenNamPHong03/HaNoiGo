import React from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import { DashboardPage } from './features/dashboard'
import { GoongImportPage } from './features/imports'
import Places from './pages/Places'
import Reviews from './pages/Reviews'
import Users from './pages/Users'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="places" element={<Places />} />
        <Route path="users" element={<Users />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="import" element={<GoongImportPage />} />
      </Route>
    </Routes>
  )
}

export default App