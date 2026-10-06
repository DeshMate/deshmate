import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import districts from './data/districts.js'
import { toolCatalog } from './data/tools.js'
import './App.css'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const DistrictsPage = lazy(() => import('./pages/DistrictsPage.jsx'))
const DistrictDetailPage = lazy(() => import('./pages/DistrictsPage.jsx').then((module) => ({ default: module.DistrictDetailPage })))
const TravelPlannerPage = lazy(() => import('./pages/TravelPlannerPage.jsx'))
const ToolsPage = lazy(() => import('./pages/ToolsPage.jsx'))
const ToolDetailPage = lazy(() => import('./pages/ToolsPage.jsx').then((module) => ({ default: module.ToolDetailPage })))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))

function StaticPage({ title, description }) {
  return (
    <section className="page-shell static-page">
      <span className="eyebrow">DESHMATE</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  )
}

function NotFoundPage() {
  return (
    <section className="page-shell static-page">
      <span className="eyebrow">404 · DESHMATE</span>
      <h1>পাতাটি খুঁজে পাওয়া যায়নি</h1>
      <p>ঠিকানাটি পরীক্ষা করুন অথবা হোম পেজ থেকে আবার শুরু করুন।</p>
      <Link className="button button-primary" to="/">হোম পেজে ফিরুন</Link>
    </section>
  )
}

function RouteMetadata() {
  const location = useLocation()
  const districtMatch = location.pathname.match(/^\/district(?:s)?\/([^/]+)$/)
  const toolMatch = location.pathname.match(/^\/tools\/([^/]+)$/)
  const district = districtMatch && districts.find((item) => item.id === decodeURIComponent(districtMatch[1]))
  const tool = toolMatch && toolCatalog.find((item) => item.id === decodeURIComponent(toolMatch[1]))
  const travelParams = new URLSearchParams(location.search)
  const travelOrigin = districts.find((item) => item.id === travelParams.get('from'))
  const travelDestination = travelParams.get('to') === 'kuakata'
    ? { nameBangla: 'কুয়াকাটা', nameEnglish: 'Kuakata' }
    : districts.find((item) => item.id === travelParams.get('to'))
  const travelDays = Number(travelParams.get('days'))
  const travelTitle = location.pathname === '/travel-planner' && travelOrigin && travelDestination
    ? `${travelOrigin.nameEnglish} → ${travelDestination.nameEnglish} — ${Number.isFinite(travelDays) && travelDays > 0 ? travelDays : 2} দিনের Travel Plan | DeshMate`
    : null
  const title = district
    ? `${district.nameBangla} (${district.nameEnglish}) ভ্রমণ গাইড | DeshMate`
    : tool
      ? `${tool.nameBangla} ক্যালকুলেটর | DeshMate`
      : travelTitle || (location.pathname === '/districts'
        ? 'বাংলাদেশের ৬৪ জেলা | DeshMate'
        : location.pathname === '/tools'
          ? 'জীবনের হিসাবের টুলস | DeshMate'
          : 'DeshMate — বাংলাদেশকে জানুন, জীবনের হিসাব করুন')
  const description = district?.shortDescription
    || tool?.summaryBangla
    || (travelOrigin && travelDestination
      ? `${travelOrigin.nameBangla} থেকে ${travelDestination.nameBangla} — DeshMate-এ তৈরি ভ্রমণ পরিকল্পনা।`
      : 'বাংলাদেশের ৬৪ জেলা ঘুরে দেখুন, ভ্রমণ পরিকল্পনা করুন এবং জীবনের প্রয়োজনীয় হিসাব করুন—সব এক জায়গায়।')

  useEffect(() => {
    document.title = title
    const descriptionTag = document.querySelector('meta[name="description"]')
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDescription = document.querySelector('meta[property="og:description"]')
    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (descriptionTag) descriptionTag.content = description
    if (ogTitle) ogTitle.content = title
    if (ogDescription) ogDescription.content = description
    if (ogUrl) ogUrl.content = window.location.href
  }, [description, title])

  return null
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('deshmate-theme') === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('deshmate-theme', theme)
    } catch {
      // Theme remains usable for this session when storage is unavailable.
    }
  }, [theme])

  return (
    <BrowserRouter>
      <RouteMetadata />
      <Suspense fallback={null}>
        <Routes>
          <Route element={<MainLayout theme={theme} setTheme={setTheme} />}>
            <Route index element={<HomePage />} />
            <Route path="districts" element={<DistrictsPage />} />
            <Route path="districts/:id" element={<DistrictDetailPage />} />
            <Route path="district/:id" element={<DistrictDetailPage />} />
            <Route path="travel-planner" element={<TravelPlannerPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="tools/:id" element={<ToolDetailPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<StaticPage title="যোগাযোগ" description="DeshMate সম্পর্কে মতামত বা পরামর্শ জানাতে hello@deshmate.com ঠিকানায় যোগাযোগ করুন।" />} />
            <Route path="privacy" element={<StaticPage title="গোপনীয়তা নীতি" description="আপনার হিসাব এই ব্রাউজারেই করা হয়। DeshMate কোনো ব্যাকএন্ড বা ডেটাবেসে আপনার ব্যক্তিগত তথ্য পাঠায় না।" />} />
            <Route path="terms" element={<StaticPage title="ব্যবহারের শর্ত" description="এই সাইটের ভ্রমণ ও খরচের হিসাবগুলো আনুমানিক পরিকল্পনার জন্য; প্রকৃত খরচ স্থান ও সময় অনুযায়ী পরিবর্তিত হতে পারে।" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
