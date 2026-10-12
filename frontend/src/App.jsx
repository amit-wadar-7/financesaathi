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
import Tools from './pages/Tools'
import { CourseView, Learn, Schemes } from './pages/Learn'
import { Savings, SHG } from './pages/Community'
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

  // Dynamic context title in header
  const getContextTitle = () => {
    const p = location.pathname
    if (p === '/') return 'Dashboard'
    if (p === '/saathi') return 'Saathi AI Assistant'
    if (p.startsWith('/loans')) return 'Loans & Microfinance'
    if (p.startsWith('/learn')) return 'Financial Academy'
    if (p === '/schemes') return 'Government Schemes'
    if (p === '/tools') return 'Financial Calculators'
    if (p === '/savings') return 'Household Savings & Budget'
    if (p === '/shg') return 'Self-Help Group (SHG)'
    if (p === '/at-risk') return 'At-Risk Portfolio'
    if (p === '/admin') return 'Administration'
    if (p === '/profile') return 'My Profile'
    return 'FinanceSaathi'
  }

  const navItems = [
    { to: '/', label: t('dashboard'), icon: <IconHome size={18} /> },
    { to: '/saathi', label: t('saathiAi'), icon: <IconBot size={18} />, isAi: true },
    { to: '/loans', label: t('loans'), icon: <IconUsers size={18} /> },
    { to: '/learn', label: t('learn'), icon: <IconAcademic size={18} /> },
    { to: '/schemes', label: t('schemes'), icon: <IconLandmark size={18} /> },
    { to: '/tools', label: t('calculators'), icon: <IconCalculator size={18} /> },
    ...(!staff ? [{ to: '/savings', label: t('savings'), icon: <IconTarget size={18} /> }] : []),
    ...(user?.role === 'shg_leader' || user?.role === 'admin' ? [{ to: '/shg', label: t('shg'), icon: <IconUsers size={18} /> }] : []),
    ...(staff ? [{ to: '/at-risk', label: t('atRisk'), icon: <IconShield size={18} /> }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: t('admin'), icon: <IconSettings size={18} /> }] : []),
    { to: '/profile', label: t('profile'), icon: <IconUser size={18} /> },
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
            <span className="brand-tagline">Microfinance Platform</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-group-title">MAIN NAVIGATION</div>
          {navItems.map((item) => (
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
              {item.isAi && <span className="nav-pill-badge">AI 2.0</span>}
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
          <div className="system-status-indicator">
            <span className="status-dot green" />
            <span>FastAPI Server Connected</span>
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
            <span>FinanceSaathi Platform © 2024 • Institutional SHG & Microfinance Network</span>
          </div>
          <div className="legal-links">
            <Link to="/privacy">Privacy Policy (DPDP 2023)</Link>
            <span className="sep">•</span>
            <Link to="/terms">Terms & Fair Practice Code</Link>
          </div>
        </footer>
      </div>

      {/* 3. Floating Saathi AI Assistant (Always available from any screen) */}
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
        <Route path="/saathi" element={<SaathiAI />} />
        <Route path="/loans" element={<LoanList />} />
        <Route path="/loans/new" element={<LoanApply />} />
        <Route path="/loans/:id" element={<LoanDetail />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:id" element={<CourseView />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/shg" element={<SHG />} />
        <Route path="/at-risk" element={<AtRisk />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </DesktopLayout>
  )
}
