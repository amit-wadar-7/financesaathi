import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { api } from './api'
import { useAuth } from './auth'
import { useLang } from './i18n'
import { Loading } from './ui'
import ErrorBoundary from './ErrorBoundary'
import { Login, Register } from './pages/Auth'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const SaathiAI = lazy(() => import('./pages/SaathiAI'))
const LoanApply = lazy(() => import('./pages/Loans').then((m) => ({ default: m.LoanApply })))
const LoanDetail = lazy(() => import('./pages/Loans').then((m) => ({ default: m.LoanDetail })))
const LoanList = lazy(() => import('./pages/Loans').then((m) => ({ default: m.LoanList })))
const SchemesPortal = lazy(() => import('./pages/SchemesPortal'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Reports = lazy(() => import('./pages/Reports'))
const Tools = lazy(() => import('./pages/Tools'))
const Savings = lazy(() => import('./pages/Community').then((m) => ({ default: m.Savings })))
const SHG = lazy(() => import('./pages/Community').then((m) => ({ default: m.SHG })))
const Learn = lazy(() => import('./pages/Learn').then((m) => ({ default: m.Learn })))
const CourseView = lazy(() => import('./pages/Learn').then((m) => ({ default: m.CourseView })))
const Admin = lazy(() => import('./pages/Account').then((m) => ({ default: m.Admin })))
const AtRisk = lazy(() => import('./pages/Account').then((m) => ({ default: m.AtRisk })))
const Notifications = lazy(() => import('./pages/Account').then((m) => ({ default: m.Notifications })))
const Profile = lazy(() => import('./pages/Account').then((m) => ({ default: m.Profile })))
const Grievances = lazy(() => import('./pages/Grievances'))
const PrivacyPolicy = lazy(() => import('./pages/Legal').then((m) => ({ default: m.PrivacyPolicy })))
const TermsOfService = lazy(() => import('./pages/Legal').then((m) => ({ default: m.TermsOfService })))
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
  IconMenu,
  IconClose,
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [location.pathname])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const getContextTitle = () => {
    const p = location.pathname
    if (p === '/') {
      if (user?.role === 'admin') return t('admin_console') || 'Admin Executive Console'
      if (user?.role === 'officer') return t('officer_desk') || 'Credit Underwriting Desk'
      if (user?.role === 'shg_leader') return t('shg_hub') || 'SHG Community Hub'
      return t('borrower_portal') || 'Borrower Financial Portal'
    }
    if (p === '/reports') return t('nav_reports') || 'Reports & Statements Center'
    if (p === '/tools') return t('nav_tools') || 'Financial Decision Calculators'
    if (p === '/savings') return t('nav_savings') || 'Household Savings & Goals'
    if (p === '/community') return t('nav_community') || 'SHG Community Hub'
    if (p === '/saathi') return t('nav_saathi') || 'Saathi AI Advisor'
    if (p.startsWith('/loans')) return t('nav_loans') || 'Loans & Credit Facility'
    if (p === '/schemes') return t('nav_schemes') || 'Government Schemes & Subsidies'
    if (p === '/transactions') return t('nav_passbook') || 'Passbook & Digital Ledger'
    if (p.startsWith('/learn')) return t('nav_learn') || 'Financial Academy'
    if (p === '/at-risk') return t('nav_at_risk') || 'At-Risk Credit Radar'
    if (p === '/admin') return t('nav_admin') || 'User Directory & Governance'
    if (p === '/profile') return t('nav_profile') || 'Borrower Profile & KYC'
    if (p === '/notifications') return t('notifications') || 'Notification Alerts'
    if (p === '/grievances') return t('nav_grievances') || 'Grievance Redressal (RBI Cell)'
    return 'FinanceSaathi'
  }

  const getRoleLabel = () => {
    if (user?.role === 'admin') return t('role_admin') || 'Super Admin'
    if (user?.role === 'officer') return t('role_officer') || 'Credit Officer'
    if (user?.role === 'shg_leader') return t('role_leader') || 'SHG Leader'
    if (user?.monthly_income > 0) return t('role_borrower') || 'Active Borrower'
    return t('role_registered') || 'Registered Member'
  }

  const getNavItems = () => {
    if (user?.role === 'admin') {
      return {
        groupTitle: t('nav_group_admin') || 'EXECUTIVE CONSOLE',
        primary: [
          { to: '/', label: t('nav_overview'), icon: <IconHome size={18} /> },
          { to: '/admin', label: t('nav_admin'), icon: <IconSettings size={18} /> },
          { to: '/reports', label: t('nav_reports'), icon: <IconFileText size={18} /> },
          { to: '/loans', label: t('nav_loans'), icon: <IconCreditCard size={18} /> },
          { to: '/at-risk', label: t('nav_at_risk'), icon: <IconShield size={18} /> },
          { to: '/schemes', label: t('nav_schemes'), icon: <IconLandmark size={18} /> },
          { to: '/transactions', label: t('nav_passbook'), icon: <IconCoins size={18} /> },
        ],
        secondaryGroupTitle: t('nav_group_governance') || 'PLATFORM GOVERNANCE',
        secondary: [
          { to: '/learn', label: t('nav_learn'), icon: <IconAcademic size={18} /> },
          { to: '/tools', label: t('nav_tools'), icon: <IconCalculator size={18} /> },
          { to: '/grievances', label: t('nav_grievances'), icon: <IconShield size={18} /> },
          { to: '/notifications', label: t('notifications'), icon: <IconBell size={18} /> },
        ],
      }
    }

    if (user?.role === 'officer') {
      return {
        groupTitle: t('nav_group_staff') || 'UNDERWRITING WORKSPACE',
        primary: [
          { to: '/', label: t('underwriting_queue') || 'Underwriting Queue', icon: <IconHome size={18} /> },
          { to: '/reports', label: t('nav_reports'), icon: <IconFileText size={18} /> },
          { to: '/loans', label: t('nav_loans'), icon: <IconCreditCard size={18} /> },
          { to: '/at-risk', label: t('nav_at_risk'), icon: <IconShield size={18} /> },
          { to: '/schemes', label: t('nav_schemes'), icon: <IconLandmark size={18} /> },
          { to: '/transactions', label: t('nav_passbook'), icon: <IconCoins size={18} /> },
        ],
        secondaryGroupTitle: t('nav_group_ops') || 'FIELD OPERATIONS',
        secondary: [
          { to: '/learn', label: t('nav_learn'), icon: <IconAcademic size={18} /> },
          { to: '/tools', label: t('nav_tools'), icon: <IconCalculator size={18} /> },
          { to: '/grievances', label: t('nav_grievances'), icon: <IconShield size={18} /> },
          { to: '/notifications', label: t('notifications'), icon: <IconBell size={18} /> },
        ],
      }
    }

    if (user?.role === 'shg_leader') {
      return {
        groupTitle: t('nav_group_community') || 'COMMUNITY & GROUP HUB',
        primary: [
          { to: '/', label: t('shg_hub') || 'SHG Leader Hub', icon: <IconHome size={18} /> },
          { to: '/reports', label: t('nav_reports'), icon: <IconFileText size={18} /> },
          { to: '/loans', label: t('nav_loans'), icon: <IconCreditCard size={18} /> },
          { to: '/transactions', label: t('nav_passbook'), icon: <IconCoins size={18} /> },
          { to: '/schemes', label: t('nav_schemes'), icon: <IconLandmark size={18} /> },
          { to: '/saathi', label: t('nav_saathi'), icon: <IconBot size={18} />, isAi: true },
        ],
        secondaryGroupTitle: t('nav_group_development') || 'GROUP DEVELOPMENT',
        secondary: [
          { to: '/community', label: t('nav_member_roster') || 'SHG Member Roster', icon: <IconUsers size={18} /> },
          { to: '/savings', label: t('nav_group_savings') || 'Group Savings Goals', icon: <IconTarget size={18} /> },
          { to: '/grievances', label: t('nav_grievances'), icon: <IconShield size={18} /> },
          { to: '/tools', label: t('nav_tools'), icon: <IconCalculator size={18} /> },
          { to: '/learn', label: t('nav_learn'), icon: <IconAcademic size={18} /> },
          { to: '/profile', label: t('nav_profile'), icon: <IconUser size={18} /> },
        ],
      }
    }

    // Default: Borrower (user)
    return {
      groupTitle: t('nav_group_financial') || 'FINANCIAL SERVICES',
      primary: [
        { to: '/', label: t('nav_overview'), icon: <IconHome size={18} /> },
        { to: '/transactions', label: t('nav_passbook'), icon: <IconCoins size={18} /> },
        { to: '/savings', label: t('nav_savings'), icon: <IconTarget size={18} /> },
        { to: '/loans', label: t('nav_loans'), icon: <IconCreditCard size={18} /> },
        { to: '/community', label: t('nav_community'), icon: <IconUsers size={18} /> },
        { to: '/schemes', label: t('nav_schemes'), icon: <IconLandmark size={18} /> },
        { to: '/saathi', label: t('nav_saathi'), icon: <IconBot size={18} />, isAi: true },
      ],
      secondaryGroupTitle: t('nav_group_tools') || 'TOOLS & ACADEMY',
      secondary: [
        { to: '/reports', label: t('nav_reports'), icon: <IconFileText size={18} /> },
        { to: '/tools', label: t('nav_tools'), icon: <IconCalculator size={18} /> },
        { to: '/learn', label: t('nav_learn'), icon: <IconAcademic size={18} /> },
        { to: '/grievances', label: t('nav_grievances'), icon: <IconShield size={18} /> },
        { to: '/profile', label: t('nav_profile'), icon: <IconUser size={18} /> },
      ],
    }
  }

  const nav = getNavItems()

  return (
    <div className="desktop-shell">
      {/* Mobile Slide-Out Drawer Backdrop & Aside (<900px) */}
      <div
        className={`mobile-drawer-backdrop ${mobileDrawerOpen ? 'open' : ''}`}
        onClick={() => setMobileDrawerOpen(false)}
      />
      <aside className={`mobile-nav-drawer ${mobileDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="brand-box">
            <div className="brand-logo-icon"><IconLogo size={20} /></div>
            <span className="brand-title">FinanceSaathi</span>
          </div>
          <button className="close-btn" onClick={() => setMobileDrawerOpen(false)} aria-label="Close menu">
            <IconClose size={18} />
          </button>
        </div>

        <nav className="drawer-nav">
          <div className="nav-group-title">{nav.groupTitle}</div>
          {nav.primary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileDrawerOpen(false)}
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
              onClick={() => setMobileDrawerOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="drawer-footer">
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

      {/* 1. Desktop Sticky Left Navigation Sidebar (>=900px) */}
      <aside className="desktop-sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand-box">
          <div className="brand-logo-icon"><IconLogo size={22} /></div>
          <div className="brand-text-wrap">
            <h1 className="brand-title">FinanceSaathi</h1>
            <span className="brand-tagline">
              {lang === 'hi' ? 'आपका पैसा • आपके लक्ष्य • आपका भविष्य' : lang === 'mr' ? 'तुमचा पैसा • तुमची उद्दिष्टे • तुमचे भविष्य' : 'Your Money • Your Goals • Your Future'}
            </span>
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
        {/* Top Header Bar */}
        <header className="desktop-top-bar">
          <div className="top-bar-left">
            <button
              className="mobile-hamburger-btn"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              aria-label="Toggle Navigation Drawer"
            >
              {mobileDrawerOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
            </button>
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

            {/* Theme Toggle (Light / Dark) */}
            <button
              className="theme-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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

        {/* Global Footer */}
        <footer className="desktop-global-footer">
          <div className="footer-left">
            <span>
              {lang === 'hi'
                ? `फाइनेंससाथी प्लेटफॉर्म © ${new Date().getFullYear()} • संस्थागत एसएचजी और माइक्रोफाइनेंस नेटवर्क (आरबीआई उचित व्यवहार संहिता अनुपालित)`
                : lang === 'mr'
                ? `फायनान्ससाथी प्लॅटफॉर्म © ${new Date().getFullYear()} • संस्थात्मक बचत गट व मायक्रोफायनान्स नेटवर्क (आरबीआय मार्गदर्शक तत्त्वांचे पालन)`
                : `FinanceSaathi Platform © ${new Date().getFullYear()} • Institutional SHG & Microfinance Network (RBI Fair Practices Compliant)`}
            </span>
          </div>
          <div className="legal-links">
            <Link to="/grievances">{t('grievance_cell') || 'Grievance Cell'}</Link>
            <span className="sep">•</span>
            <Link to="/privacy">{t('privacy_policy') || 'Privacy Policy'}</Link>
            <span className="sep">•</span>
            <Link to="/terms">{t('fair_practice_code') || 'Fair Practice Code'}</Link>
          </div>
        </footer>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (<900px) */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `mob-tab ${isActive ? 'active' : ''}`}>
          <span className="mob-icon"><IconHome size={20} /></span>
          <span className="mob-label">{t('home') || 'Home'}</span>
        </NavLink>
        <NavLink to="/loans" className={({ isActive }) => `mob-tab ${isActive ? 'active' : ''}`}>
          <span className="mob-icon"><IconCreditCard size={20} /></span>
          <span className="mob-label">{t('loans') || 'Loans'}</span>
        </NavLink>
        <NavLink to="/transactions" className={({ isActive }) => `mob-tab ${isActive ? 'active' : ''}`}>
          <span className="mob-icon"><IconCoins size={20} /></span>
          <span className="mob-label">{t('passbook') || 'Passbook'}</span>
        </NavLink>
        <NavLink to="/saathi" className={({ isActive }) => `mob-tab ${isActive ? 'active' : ''}`}>
          <span className="mob-icon"><IconBot size={20} /></span>
          <span className="mob-label">{t('saathi') || 'Saathi'}</span>
        </NavLink>
        <button
          type="button"
          className="mob-tab"
          onClick={() => setMobileDrawerOpen(true)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          aria-label={t('more') || 'Open More Menu'}
        >
          <span className="mob-icon"><IconMenu size={20} /></span>
          <span className="mob-label">{t('more') || 'More'}</span>
        </button>
      </nav>

      {/* 4. Floating Saathi AI Assistant (Desktop/Tablet) */}
      {location.pathname !== '/saathi' && (
        <>
          <button
            className="floating-saathi-trigger"
            onClick={() => setFloatingChatOpen(!floatingChatOpen)}
            title={t('askSaathi') || 'Ask Saathi AI'}
            aria-label={t('askSaathi') || 'Ask Saathi AI Assistant'}
          >
            <span className="floating-robot"><IconBot size={18} /></span>
            <span className="floating-label">{t('askSaathi') || 'Ask Saathi'}</span>
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

function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: 520, margin: '3rem auto', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔒</div>
          <h3 style={{ color: 'var(--color-danger, #dc2626)' }}>Restricted Access</h3>
          <p className="muted" style={{ margin: '0.75rem 0 1.5rem' }}>
            Your current account role (<strong>{user.role}</strong>) does not have authorization to view this operational module.
          </p>
          <Link to="/" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }
  return children
}

function NotFound() {
  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: 520, margin: '3rem auto', textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧭</div>
        <h2>Page Not Found (404)</h2>
        <p className="muted" style={{ margin: '0.75rem 0 1.5rem' }}>
          The requested destination does not exist or has been relocated within FinanceSaathi.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
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
    <ErrorBoundary title="Application Interface Error">
      <DesktopLayout>
        <Suspense fallback={<div className="center-loader"><Loading /></div>}>
          <Routes>
            <Route path="/" element={<ErrorBoundary title="Dashboard Error"><Dashboard /></ErrorBoundary>} />
            <Route path="/loans" element={<ErrorBoundary title="Loans Workspace Error"><LoanList /></ErrorBoundary>} />
            <Route path="/loans/new" element={<ErrorBoundary title="Loan Application Error"><LoanApply /></ErrorBoundary>} />
            <Route path="/loans/:id" element={<ErrorBoundary title="Loan Detail Error"><LoanDetail /></ErrorBoundary>} />
            <Route path="/schemes" element={<ErrorBoundary title="Government Schemes Error"><SchemesPortal /></ErrorBoundary>} />
            <Route path="/transactions" element={<ErrorBoundary title="Passbook & Ledger Error"><Transactions /></ErrorBoundary>} />
            <Route path="/reports" element={<ErrorBoundary title="Reports Desk Error"><Reports /></ErrorBoundary>} />
            <Route path="/tools" element={<ErrorBoundary title="Financial Calculators Error"><Tools /></ErrorBoundary>} />
            <Route path="/savings" element={<ErrorBoundary title="Savings Goals Error"><Savings /></ErrorBoundary>} />
            <Route path="/community" element={<ErrorBoundary title="SHG Community Hub Error"><SHG /></ErrorBoundary>} />
            <Route path="/saathi" element={<ErrorBoundary title="Saathi AI Advisor Error"><SaathiAI /></ErrorBoundary>} />
            <Route path="/profile" element={<ErrorBoundary title="Profile Error"><Profile /></ErrorBoundary>} />
            <Route path="/learn" element={<ErrorBoundary title="Financial Academy Error"><Learn /></ErrorBoundary>} />
            <Route path="/learn/:id" element={<ErrorBoundary title="Course Module Error"><CourseView /></ErrorBoundary>} />
            <Route
              path="/at-risk"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <ErrorBoundary title="Credit Risk Radar Error"><AtRisk /></ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ErrorBoundary title="Admin Governance Error"><Admin /></ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route path="/grievances" element={<ErrorBoundary title="Grievance Cell Error"><Grievances /></ErrorBoundary>} />
            <Route path="/notifications" element={<ErrorBoundary title="Notifications Error"><Notifications /></ErrorBoundary>} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </DesktopLayout>
    </ErrorBoundary>
  )
}
