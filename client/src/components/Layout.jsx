import { Outlet, Link, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

function Layout() {
  const location = useLocation()
  
  return (
    <div>
      <header className={styles.header}>
        <div className={`container ${styles.headerContent}`}>
          <Link to="/" className={styles.logo}>
            HaNoiGo
          </Link>
          
          <nav className={styles.nav}>
            <Link 
              to="/" 
              className={`${styles.navLink} ${location.pathname === '/' ? styles.navLinkActive : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/places" 
              className={`${styles.navLink} ${location.pathname === '/places' ? styles.navLinkActive : ''}`}
            >
              Places
            </Link>
            <Link 
              to="/chat" 
              className={`${styles.navLink} ${location.pathname === '/chat' ? styles.navLinkActive : ''}`}
            >
              AI Chat
            </Link>
          </nav>
          
          <div className={styles.userMenu}>
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerContent}`}>
          <div className={styles.footerSection}>
            <h3>HaNoiGo</h3>
            <p>Khám phá Hà Nội một cách thông minh</p>
          </div>
          <div className={styles.footerSection}>
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/places">Places</Link></li>
              <li><Link to="/chat">AI Chat</Link></li>
              <li><Link to="/profile">Profile</Link></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h3>Contact</h3>
            <ul>
              <li>Email: support@hanoigo.com</li>
              <li>Phone: +84 123 456 789</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout