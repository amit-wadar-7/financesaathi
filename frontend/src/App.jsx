import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { api } from './api'
import { useAuth } from './auth'
import { useLang } from './i18n'
import { Loading } from './ui'
import { Login, Register } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import SaathiAI from './pages/SaathiAI'
import { LoanApply, LoanDetail, LoanList } from './pages/Loans'
import SchemesPortal from './pages/SchemesPortal'
import Transactions from './pages/Transactions'
import { CourseView, Learn } from './pages/Learn'
import { Admin, AtRisk, Notifications, Profile } from './pages/Account'
import { PrivacyPolicy, TermsOfService } from './pages/Legal'
import {
  IconLogo,
  IconHome,
  IconBot,
  IconUsers,
  IconAcademic,
  IconLandmark,
  IconCalculator,
  IconTarget,
  IconShield,
  IconSettings,
  IconUser,
  IconBell,
  IconCreditCard,
  IconCoins,
} from './icons'

function BellDropdown() {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const loc = useLocation()

  useEffect(() => {
    api('/notifications')
      .then((r) => setItems(r))
      .catch(() => {})
  }, [loc.pathname])

  const unreadCount = items.filter((x) => !x.read).length

  return (
    <div className="bell-dropdown-container">
      <button
        className="bell-btn"
        onClick={() => setOpen(!open)}
        title="Notifications"
        aria-label="Notifications"
      >
        <span className="bell-icon"><IconBell size={18} /></span>
        {unreadCount > 0 && <span className="bell-dot">{unreadCount}</span>}
      </button>

      {open && (
        <div className="bell-popup">
          <div className="bell-popup-header">
            <h4>Notifications</h4>
            <span className="badge small">{unreadCount} new</span>
          </div>
          <div className="bell-popup-list">
            {items.length === 0 ? (
              <p className="muted small p-2">No new notifications</p>
            ) : (
              items.slice(0, 5).map((n) => (
                <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
                  <span className="notif-dot" />
                  <div className="notif-text">
                    <p>{n.message}</p>
                    <small className="muted">{new Date(n.created_at || Date.now()).toLocaleDateString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="bell-popup-footer">
            <Link to="/notifications" onClick={() => setOpen(false)} className="small">
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function DesktopLayout({ children }) {
  const { user, logout } = useAuth()
  const { t, lang, setLang } = useLang()
  const location = useLocation()
  const [floatingChatOpen, setFloatingChatOpen] = useState(false)

  const staff = user?.role === 'officer' || user?.role === 'admin'

  const getContextTitle = () => {
    const p = location.pathname
    if (p === '/') return 'Account Overview'
    if (p === '/saathi') return 'Saathi AI Advisor'
    if (p.startsWith('/loans')) return 'Loans & Credit'
    if (p === '/schemes') return 'Government Schemes & Subsidies'
    if (p === '/transactions') return 'Passbook & Transactions'
    if (p.startsWith('/learn')) return 'Financial Academy'
    if (p === '/at-risk') return 'At-Risk Portfolio'
    if (p === '/admin') return 'Administration'
    if (p === '/profile') return 'Borrower Profile & KYC'
    return 'FinanceSaathi'
  }

  const primaryNavItems = [
    { to: '/', label: 'Overview', icon: <IconHome size={18} /> },
    { to: '/loans', label: 'Loans & Credit', icon: <IconCreditCard size={18} /> },
    { to: '/schemes', label: 'Govt Schemes', icon: <IconLandmark size={18} /> },
    { to: '/transactions', label: 'Passbook & Ledger', icon: <IconCoins size={18} /> },
    { to: '/saathi', label: 'Saathi AI Advisor', icon: <IconBot size={18} />, isAi: true },
    { to: '/profile', label: 'Profile & KYC', icon: <IconUser size={18} /> },
  ]

  const secondaryNavItems = [
    { to: '/learn', label: 'Financial Academy', icon: <IconAcademic size={18} /> },
    ...(staff ? [{ to: '/at-risk', label: 'At-Risk Credit', icon: <IconShield size={18} /> }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin Console', icon: <IconSettings size={18} /> }] : []),
  ]

  return (
    <div className="desktop-shell">
      {/* 1. Desktop Sticky Left Navigation Sidebar */}
      <aside className="desktop-sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand-box">
          <div className="brand-logo-icon"><IconLogo size={22} /></div>
          <div className="brand-text-wrap">
            <h1 className="brand-title">FinanceSaathi</h1>
            <span className="brand-tagline">Institutional Microfinance</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-group-title">FINANCIAL SERVICES</div>
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${item.isAi ? 'ai-special-link' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
              {item.isAi && <span className="nav-pill-badge">AI</span>}
            </NavLink>
          ))}

          <div className="nav-group-title" style={{ marginTop: '1rem' }}>EDUCATION & TOOLS</div>
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer User Capsule */}
        <div className="sidebar-footer">
          <div className="user-capsule">
            <div className="avatar-circle">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'MB'}
            </div>
            <div className="user-capsule-text">
              <span className="user-capsule-name">{user?.name || 'Member'}</span>
              <span className="user-capsule-role">{user?.role || 'user'}</span>
            </div>
            <button className="logout-btn" onClick={logout} title="Sign Out">
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="desktop-main-wrapper">
        {/* Desktop Top Header Bar */}
        <header className="desktop-top-bar">
          <div className="top-bar-left">
            <div className="top-brand-mobile"><IconLogo size={18} /> FinanceSaathi</div>
            <div className="context-breadcrumb">
              <span className="context-app-name">FinanceSaathi</span>
              <span className="context-slash">/</span>
              <span className="context-current">{getContextTitle()}</span>
            </div>
          </div>

          <div className="top-bar-right">
            {/* Multilingual Pill Toggles (EN | हि | मरा) */}
            <div className="lang-toggle-pills" role="group" aria-label="Language selection">
              <button
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
                onClick={() => setLang('hi')}
              >
                हि
              </button>
              <button
                className={`lang-btn ${lang === 'mr' ? 'active' : ''}`}
                onClick={() => setLang('mr')}
              >
                मरा
              </button>
            </div>

            {/* Notification Bell with Badge & Dropdown */}
            <BellDropdown />

            {/* User Profile Avatar Pill */}
            <Link to="/profile" className="profile-pill-btn" title="View Profile">
              <div className="top-avatar">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'MB'}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="desktop-page-content">{children}</main>

        {/* Global Desktop Footer */}
        <footer className="desktop-global-footer">
          <div className="footer-left">
            <span>FinanceSaathi Platform © 2024 • Institutional SHG & Microfinance Network (RBI Fair Practices Compliant)</span>
          </div>
          <div className="legal-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="sep">•</span>
            <Link to="/terms">Fair Practice Code</Link>
          </div>
        </footer>
      </div>

      {/* 3. Floating Saathi AI Assistant */}
      {location.pathname !== '/saathi' && (
        <>
          <button
            className="floating-saathi-trigger"
            onClick={() => setFloatingChatOpen(!floatingChatOpen)}
            title="Ask Saathi AI"
          >
            <span className="floating-robot"><IconBot size={18} /></span>
            <span className="floating-label">Ask Saathi</span>
            <span className="floating-dot" />
          </button>

          {floatingChatOpen && (
            <div className="floating-saathi-drawer">
              <SaathiAI isWidget={true} onClose={() => setFloatingChatOpen(false)} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="center-loader">
        <Loading />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <DesktopLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/loans" element={<LoanList />} />
        <Route path="/loans/new" element={<LoanApply />} />
        <Route path="/loans/:id" element={<LoanDetail />} />
        <Route path="/schemes" element={<SchemesPortal />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/saathi" element={<SaathiAI />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:id" element={<CourseView />} />
        <Route path="/at-risk" element={<AtRisk />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </DesktopLayout>
  )
}
