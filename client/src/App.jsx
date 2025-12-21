import { Route, Routes } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { UserProvider } from './contexts/UserContext'
import { CursorProvider } from './contexts/CursorContext'
import Layout from './components/Layout/Layout.jsx'
import { LenisProvider } from './hooks/useLenis'

// Optimization: Lazy load pages (Rules.md §7 Code Splitting)
const Home = lazy(() => import('./pages/Home/Home'))
const Login = lazy(() => import('./pages/Authentication/Login'))
const Register = lazy(() => import('./pages/Authentication/Register'))
const SearchResult = lazy(() => import('./pages/SearchResult/SearchResult'))

// Simple Loading Fallback
const LoadingFallback = () => (
  <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    Loading...
  </div>
);

import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <UserProvider>
      <CursorProvider>
        <LenisProvider>
          <Toaster position="top-right" />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="/search" element={<SearchResult />} />
              </Route>
            </Routes>
          </Suspense>
        </LenisProvider>
      </CursorProvider>
    </UserProvider>
  )
}

export default App