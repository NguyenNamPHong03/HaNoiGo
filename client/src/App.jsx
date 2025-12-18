import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { UserProvider } from './contexts/UserContext'
import Chat from './pages/Chat'
import Home from './pages/Home'
import Login from './pages/Login'
import PlaceDetail from './pages/PlaceDetail'
import Places from './pages/Places'
import Profile from './pages/Profile'
import Register from './pages/Register'

function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="places" element={<Places />} />
          <Route path="places/:id" element={<PlaceDetail />} />
          <Route path="chat" element={<Chat />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </UserProvider>
  )
}

export default App