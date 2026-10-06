import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Compass, Menu, Moon, Sun, X } from 'lucide-react'
import districts from '../data/districts.js'
import { toolCatalog } from '../data/tools.js'
import SearchBar from '../components/SearchBar.jsx'
import SocialShareActions from '../components/SocialShareActions.jsx'

const navItems = [
  { label: 'হোম', to: '/' },
  { label: 'জেলাসমূহ', to: '/districts' },
  { label: 'ভ্রমণ পরিকল্পনা', to: '/travel-planner' },
  { label: 'লাইফ টুলস', to: '/tools' },
  { label: 'আমাদের কথা', to: '/about' },
]

export default function MainLayout({ theme, setTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  const searchItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (query.length < 1) return []
    const districtItems = districts
      .filter((district) =>
        [district.nameBangla, district.nameEnglish, district.divisionBangla]
          .some((value) => value.toLocaleLowerCase().includes(query)),
      )
      .map((district) => ({
        label: `${district.nameBangla} · ${district.nameEnglish}`,
        description: `${district.divisionBangla} বিভাগ`,
        to: `/districts/${district.id}`,
        type: 'জেলা',
      }))
    const toolItems = toolCatalog
      .filter((tool) => [tool.name, tool.nameBangla, tool.summary, tool.summaryBangla]
        .some((value) => value.toLocaleLowerCase().includes(query)))
      .map((tool) => ({
        label: tool.nameBangla,
        description: tool.name,
        to: `/tools/${tool.id}`,
        type: 'টুল',
      }))
    return [...districtItems, ...toolItems].slice(0, 6)
  }, [search])

  return (
    <div className="site-frame">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="DeshMate হোম">
            <span className="brand-mark"><Compass size={22} /></span>
            <span className="brand-copy">
              <strong>DeshMate</strong>
              <small>বাংলাদেশ আপনার হাতের মুঠোয়</small>
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="প্রধান নেভিগেশন">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <div className="global-search">
              <SearchBar
                value={search}
                onChange={setSearch}
                results={searchItems}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
            <button
              className="icon-button theme-button"
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="icon-button mobile-menu-button"
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="mobile-nav" aria-label="মোবাইল নেভিগেশন">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="main-content"><Outlet /></main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="brand">
              <span className="brand-mark"><Compass size={22} /></span>
              <span className="brand-copy"><strong>DeshMate</strong><small>বাংলাদেশকে জানুন, জীবনের হিসাব করুন</small></span>
            </Link>
            <p>ভ্রমণ পরিকল্পনা ও জীবনের হিসাব—সব এক জায়গায়।</p>
          </div>
          <div className="footer-links">
            <Link to="/about">আমাদের সম্পর্কে</Link>
            <Link to="/contact">যোগাযোগ</Link>
            <Link to="/privacy">গোপনীয়তা</Link>
            <Link to="/terms">শর্তাবলি</Link>
          </div>
          <div className="footer-social-share">
            <span>DeshMate শেয়ার করুন</span>
            <SocialShareActions compact />
          </div>
          <p className="copyright">© 2026 DeshMate. সর্বস্বত্ব সংরক্ষিত। | MD INJAMAM UL HAQUE</p>
        </div>
      </footer>
    </div>
  )
}
