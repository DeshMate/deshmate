import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import DistrictsPage from './pages/DistrictsPage.jsx'
import TravelPlannerPage from './pages/TravelPlannerPage.jsx'
import { DistrictDetailPage } from './pages/DistrictsPage.jsx'
import ToolsPage, { ToolDetailPage } from './pages/ToolsPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import './App.css'

function StaticPage({ title, description }) {
  return (
    <section className="page-shell static-page">
      <span className="eyebrow">DESHMATE</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  )
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
      <Routes>
        <Route element={<MainLayout theme={theme} setTheme={setTheme} />}>
          <Route index element={<HomePage />} />
          <Route path="districts" element={<DistrictsPage />} />
          <Route path="districts/:id" element={<DistrictDetailPage />} />
          <Route path="travel-planner" element={<TravelPlannerPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="tools/:id" element={<ToolDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<StaticPage title="যোগাযোগ" description="DeshMate সম্পর্কে মতামত বা পরামর্শ জানাতে hello@deshmate.com ঠিকানায় যোগাযোগ করুন।" />} />
          <Route path="privacy" element={<StaticPage title="গোপনীয়তা নীতি" description="আপনার হিসাব এই ব্রাউজারেই করা হয়। DeshMate কোনো ব্যাকএন্ড বা ডেটাবেসে আপনার ব্যক্তিগত তথ্য পাঠায় না।" />} />
          <Route path="terms" element={<StaticPage title="ব্যবহারের শর্ত" description="এই সাইটের ভ্রমণ ও খরচের হিসাবগুলো আনুমানিক পরিকল্পনার জন্য; প্রকৃত খরচ স্থান ও সময় অনুযায়ী পরিবর্তিত হতে পারে।" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
