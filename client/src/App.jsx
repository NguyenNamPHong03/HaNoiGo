import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout.jsx'
import { CursorProvider } from './contexts/CursorContext'
import { UserProvider } from './contexts/UserContext'
import { LenisProvider } from './hooks/useLenis'

// Optimization: Lazy load pages (Rules.md §7 Code Splitting)
const Home = lazy(() => import('./pages/Home/Home'))
const Login = lazy(() => import('./pages/Authentication/Login'))
const Register = lazy(() => import('./pages/Authentication/Register'))
const OAuthSuccess = lazy(() => import('./pages/Authentication/OAuthSuccess'))
const SearchResult = lazy(() => import('./pages/SearchResult/SearchResult'))
const Profile = lazy(() => import('./pages/Profile/Profile'))

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
              <Route path="/oauth-success" element={<OAuthSuccess />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="/search" element={<SearchResult />} />
                <Route path="/places/:id" element={<SearchResult />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Routes>
          </Suspense>
        </LenisProvider>
      </CursorProvider>
    </UserProvider>
  )
}

export default App