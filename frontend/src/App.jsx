import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
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
import Reports from './pages/Reports'
import Tools from './pages/Tools'
import { Savings, SHG } from './pages/Community'
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
  IconFileText,
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

const DEMO_PERSONAS = [
  { id: 'amit', role: 'user', label: 'Amit Wadar', desc: 'Borrower (Kisan & Agri)', email: 'amit@syra-demo.com', pw: 'amit123' },
  { id: 'pooja', role: 'user', label: 'Pooja Patil', desc: 'Borrower (SHG Tailoring)', email: 'borrower@syra-demo.com', pw: 'borrower123' },
  { id: 'leader', role: 'shg_leader', label: 'Sunita Kamble', desc: 'SHG Leader (Group Desk)', email: 'leader@syra-demo.com', pw: 'leader123' },
  { id: 'officer', role: 'officer', label: 'Ramesh Deshmukh', desc: 'Credit Officer (Sanctions)', email: 'officer@syra-demo.com', pw: 'officer123' },
  { id: 'admin', role: 'admin', label: 'Rajesh Sharma', desc: 'Super Admin (System Console)', email: 'admin@syra-demo.com', pw: 'admin123' },
]

function RolePerspectiveSwitcher() {
  const { user, login } = useAuth()
  const [switching, setSwitching] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const currentPersona = DEMO_PERSONAS.find((p) => p.email === user?.email) ||
    DEMO_PERSONAS.find((p) => p.role === user?.role) || DEMO_PERSONAS[0]

  const switchRole = async (target) => {
    if (target.email === user?.email) {
      setOpen(false)
      return
    }
    setSwitching(true)
    setOpen(false)
    try {
      await login(target.email, target.pw)
      navigate('/')
    } catch (err) {
      console.error('Failed to switch perspective', err)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="role-switcher-container">
      <button
        className="role-switcher-btn"
        onClick={() => setOpen(!open)}
        disabled={switching}
        title="Switch perspective between user accounts"
        aria-label="Switch perspective"
      >
        <span className="role-label-tag">{switching ? 'Switching…' : 'Active User:'}</span>
        <span className="role-current-name">{currentPersona.label}</span>
        <span className="role-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="role-switcher-popup">
          <div className="role-switcher-popup-header">
            <span>Switch User Perspective</span>
            <small className="muted">Instant Switch</small>
          </div>
          <div className="role-switcher-list">
            {DEMO_PERSONAS.map((p) => {
              const active = p.email === user?.email
              return (
                <button
                  key={p.id}
                  className={`role-switcher-item ${active ? 'active' : ''}`}
                  onClick={() => switchRole(p)}
                  disabled={switching}
                >
                  <div className="role-item-main">
                    <span className="role-item-title">{p.label}</span>
                    <span className="role-item-email">{p.desc}</span>
                  </div>
                  {active ? (
                    <span className="active-indicator">Active</span>
                  ) : (
                    <span className="switch-to-pill">Switch</span>
                  )}
                </button>
              )
            })}
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
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const getContextTitle = () => {
    const p = location.pathname
    if (p === '/') {
      if (user?.role === 'admin') return 'Admin Executive Console'
      if (user?.role === 'officer') return 'Credit Underwriting Desk'
      if (user?.role === 'shg_leader') return 'SHG Community Hub'
      return 'Borrower Financial Portal'
    }
    if (p === '/reports') return 'Reports & Statements Center'
    if (p === '/tools') return 'Financial Decision Calculators'
    if (p === '/savings') return 'Household Savings & Goals'
    if (p === '/community') return 'SHG Community Hub'
    if (p === '/saathi') return 'Saathi AI Advisor'
    if (p.startsWith('/loans')) return 'Loans & Credit Facility'
    if (p === '/schemes') return 'Government Schemes & Subsidies'
    if (p === '/transactions') return 'Passbook & Digital Ledger'
    if (p.startsWith('/learn')) return 'Financial Academy'
    if (p === '/at-risk') return 'At-Risk Credit Radar'
    if (p === '/admin') return 'User Directory & Governance'
    if (p === '/profile') return 'Borrower Profile & KYC'
    if (p === '/notifications') return 'Notification Alerts'
    return 'FinanceSaathi'
  }

  const getRoleLabel = () => {
    if (user?.role === 'admin') return 'Super Admin'
    if (user?.role === 'officer') return 'Credit Officer'
    if (user?.role === 'shg_leader') return 'SHG Leader'
    return 'Verified Borrower'
  }

  const getNavItems = () => {
    if (user?.role === 'admin') {
      return {
        groupTitle: 'EXECUTIVE CONSOLE',
        primary: [
          { to: '/', label: 'Overview Console', icon: <IconHome size={18} /> },
          { to: '/admin', label: 'User Directory & Roles', icon: <IconSettings size={18} /> },
          { to: '/reports', label: 'Reports & Analytics', icon: <IconFileText size={18} /> },
          { to: '/loans', label: 'Loan Underwriting Desk', icon: <IconCreditCard size={18} /> },
          { to: '/at-risk', label: 'At-Risk Credit Radar', icon: <IconShield size={18} /> },
          { to: '/schemes', label: 'Govt Schemes Directory', icon: <IconLandmark size={18} /> },
          { to: '/transactions', label: 'Audit Transactions', icon: <IconCoins size={18} /> },
        ],
        secondaryGroupTitle: 'PLATFORM GOVERNANCE',
        secondary: [
          { to: '/learn', label: 'Financial Academy', icon: <IconAcademic size={18} /> },
          { to: '/tools', label: 'Decision Models', icon: <IconCalculator size={18} /> },
          { to: '/notifications', label: 'System Audit Alerts', icon: <IconBell size={18} /> },
        ],
      }
    }

    if (user?.role === 'officer') {
      return {
        groupTitle: 'UNDERWRITING WORKSPACE',
        primary: [
          { to: '/', label: 'Underwriting Queue', icon: <IconHome size={18} /> },
          { to: '/reports', label: 'Reports & Statements', icon: <IconFileText size={18} /> },
          { to: '/loans', label: 'Sanction Desk & Reviews', icon: <IconCreditCard size={18} /> },
          { to: '/at-risk', label: 'At-Risk Delinquency Radar', icon: <IconShield size={18} /> },
          { to: '/schemes', label: 'Govt Subsidy Catalog', icon: <IconLandmark size={18} /> },
          { to: '/transactions', label: 'Borrower Passbooks', icon: <IconCoins size={18} /> },
        ],
        secondaryGroupTitle: 'FIELD OPERATIONS',
        secondary: [
          { to: '/learn', label: 'Academy Modules', icon: <IconAcademic size={18} /> },
          { to: '/tools', label: 'Credit Risk Calculators', icon: <IconCalculator size={18} /> },
          { to: '/notifications', label: 'Credit Risk Alerts', icon: <IconBell size={18} /> },
        ],
      }
    }

    if (user?.role === 'shg_leader') {
      return {
        groupTitle: 'COMMUNITY & GROUP HUB',
        primary: [
          { to: '/', label: 'SHG Leader Hub', icon: <IconHome size={18} /> },
          { to: '/reports', label: 'Group Audit & Reports', icon: <IconFileText size={18} /> },
          { to: '/loans', label: 'Group Loans & Limits', icon: <IconCreditCard size={18} /> },
          { to: '/transactions', label: 'Group Passbook & Ledger', icon: <IconCoins size={18} /> },
          { to: '/schemes', label: 'Govt Schemes & Grants', icon: <IconLandmark size={18} /> },
          { to: '/saathi', label: 'Saathi AI Advisor', icon: <IconBot size={18} />, isAi: true },
        ],
        secondaryGroupTitle: 'GROUP DEVELOPMENT',
        secondary: [
          { to: '/community', label: 'SHG Member Roster', icon: <IconUsers size={18} /> },
          { to: '/savings', label: 'Group Savings Goals', icon: <IconTarget size={18} /> },
          { to: '/tools', label: 'Financial Calculators', icon: <IconCalculator size={18} /> },
          { to: '/learn', label: 'Financial Literacy', icon: <IconAcademic size={18} /> },
          { to: '/profile', label: 'SHG Profile & KYC', icon: <IconUser size={18} /> },
        ],
      }
    }

    // Default: Borrower (user)
    return {
      groupTitle: 'FINANCIAL SERVICES',
      primary: [
        { to: '/', label: 'Overview', icon: <IconHome size={18} /> },
        { to: '/transactions', label: 'My Passbook & Ledger', icon: <IconCoins size={18} /> },
        { to: '/savings', label: 'Savings Goals', icon: <IconTarget size={18} /> },
        { to: '/loans', label: 'Loans & Credit Facility', icon: <IconCreditCard size={18} /> },
        { to: '/community', label: 'SHG Community Hub', icon: <IconUsers size={18} /> },
        { to: '/schemes', label: 'Government Schemes', icon: <IconLandmark size={18} /> },
        { to: '/saathi', label: 'Saathi AI Advisor', icon: <IconBot size={18} />, isAi: true },
      ],
      secondaryGroupTitle: 'TOOLS & ACADEMY',
      secondary: [
        { to: '/reports', label: 'Reports & Certificates', icon: <IconFileText size={18} /> },
        { to: '/tools', label: 'Financial Calculators', icon: <IconCalculator size={18} /> },
        { to: '/learn', label: 'Financial Academy', icon: <IconAcademic size={18} /> },
        { to: '/profile', label: 'Profile & KYC', icon: <IconUser size={18} /> },
      ],
    }
  }

  const nav = getNavItems()

  return (
    <div className="desktop-shell">
      {/* 1. Desktop Sticky Left Navigation Sidebar */}
      <aside className="desktop-sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand-box">
          <div className="brand-logo-icon"><IconLogo size={22} /></div>
          <div className="brand-text-wrap">
            <h1 className="brand-title">FinanceSaathi</h1>
            <span className="brand-tagline">Your Money • Your Goals • Your Future</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-group-title">{nav.groupTitle}</div>
          {nav.primary.map((item) => (
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

          <div className="nav-group-title" style={{ marginTop: '1rem' }}>{nav.secondaryGroupTitle}</div>
          {nav.secondary.map((item) => (
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
              <span className="user-capsule-role">{getRoleLabel()}</span>
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
            {/* Quick 1-Click Role Perspective Switcher */}
            <RolePerspectiveSwitcher />

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

            {/* Theme Toggle (Light / Dark) */}
            <button
              className="theme-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                width: '32px',
                height: '32px',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

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
        <Route path="/reports" element={<Reports />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/community" element={<SHG />} />
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
