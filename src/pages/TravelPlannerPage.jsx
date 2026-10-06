import { useState } from 'react'
import {
  ArrowRight,
  Compass,
  Copy,
  FileText,
  Image,
  MapPin,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import districts from '../data/districts.js'
import { calculateAutomaticTravelEstimate, formatCurrency } from '../utils/calculations.js'

const SAVED_TOURS_KEY = 'deshmate-saved-tours'
const kuakata = {
  id: 'kuakata',
  nameBangla: 'কুয়াকাটা',
  nameEnglish: 'Kuakata',
  divisionEnglish: 'Barishal',
}
const locationOptions = [...districts, kuakata]
const costLabels = [
  ['transport', 'যাতায়াত'],
  ['accommodation', 'থাকা'],
  ['food', 'খাবার'],
  ['localTransport', 'স্থানীয় যাতায়াত'],
  ['other', 'অন্যান্য প্রয়োজনীয় খরচ'],
]

function findLocation(value) {
  const query = String(value || '').trim().toLocaleLowerCase()
  if (!query) return null
  return locationOptions.find((location) =>
    [location.nameEnglish, location.nameBangla, location.id]
      .some((name) => name.toLocaleLowerCase() === query),
  ) || null
}

function readSavedTours() {
  try {
    const stored = localStorage.getItem(SAVED_TOURS_KEY)
    if (!stored) return { tours: [], error: '' }
    const tours = JSON.parse(stored)
    if (!Array.isArray(tours)) throw new Error('Saved tours data is not a list')
    const validTours = tours.filter((tour) =>
      tour
      && typeof tour.id === 'string'
      && typeof tour.name === 'string'
      && typeof tour.originId === 'string'
      && typeof tour.destinationId === 'string'
      && Boolean(findLocation(tour.originId))
      && Boolean(findLocation(tour.destinationId))
      && tour.originId !== tour.destinationId
      && Number.isSafeInteger(Number(tour.days))
      && Number(tour.days) >= 1
      && Number(tour.days) <= 365
      && Number.isSafeInteger(Number(tour.travelers))
      && Number(tour.travelers) >= 1
      && Number(tour.travelers) <= 1000,
    )
    return {
      tours: validTours,
      error: validTours.length === tours.length ? '' : 'কিছু সংরক্ষিত ট্যুরের তথ্য সঠিক নয়; সেগুলো দেখানো হয়নি।',
    }
  } catch {
    return { tours: [], error: 'সংরক্ষিত ট্যুর পড়া যায়নি। ব্রাউজারের storage সেটিংস পরীক্ষা করুন।' }
  }
}

function buildTourDetails(estimate) {
  const route = `${estimate.origin.nameEnglish} → ${estimate.destination.nameEnglish}`
  const breakdown = costLabels
    .map(([key, label]) => `${label}: ${formatCurrency(estimate.costs.breakdown[key].min)} – ${formatCurrency(estimate.costs.breakdown[key].max)}`)
    .join('\n')
  return [
    `DeshMate — ${route}`,
    'বাংলাদেশকে জানুন, জীবনের হিসাব করুন',
    `রুট: ${estimate.origin.nameBangla} → ${estimate.destination.nameBangla}`,
    `দূরত্ব: প্রায় ${estimate.costs.distanceKm} কিমি (একমুখী)`,
    `সময়: ${estimate.costs.assumptions.days} দিন · ${estimate.costs.assumptions.travelers} জন`,
    breakdown,
    `মোট আনুমানিক খরচ: ${formatCurrency(estimate.costs.total.min)} – ${formatCurrency(estimate.costs.total.max)}`,
    `জনপ্রতি: ${formatCurrency(estimate.costs.perPerson.min)} – ${formatCurrency(estimate.costs.perPerson.max)}`,
  ].join('\n')
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character])
}

function downloadTourImage(estimate, format) {
  const rows = costLabels.map(([key, label], index) => {
    const y = 485 + index * 62
    const range = `${formatCurrency(estimate.costs.breakdown[key].min)} – ${formatCurrency(estimate.costs.breakdown[key].max)}`
    return `<text x="100" y="${y}" class="body">${escapeXml(label)}</text><text x="860" y="${y}" text-anchor="end" class="amount">${escapeXml(range)}</text><line x1="100" y1="${y + 22}" x2="860" y2="${y + 22}" class="rule"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1060" viewBox="0 0 1000 1060">
    <style>.bg{fill:#f3f7fd}.card{fill:#fff;stroke:#e1e9f4;stroke-width:2}.blue{fill:#1769e0}.brand{font:700 34px 'Noto Sans Bengali',Arial,sans-serif;fill:#152b43}.sub{font:20px 'Noto Sans Bengali',Arial,sans-serif;fill:#718197}.title{font:700 32px 'Noto Sans Bengali',Arial,sans-serif;fill:#152b43}.body{font:20px 'Noto Sans Bengali',Arial,sans-serif;fill:#53657c}.amount{font:600 20px 'Noto Sans Bengali',Arial,sans-serif;fill:#152b43}.totalLabel{font:20px 'Noto Sans Bengali',Arial,sans-serif;fill:#dbeaff}.total{font:700 30px 'Noto Sans Bengali',Arial,sans-serif;fill:#fff}.rule{stroke:#e5ebf3}.footer{font:16px 'Noto Sans Bengali',Arial,sans-serif;fill:#718197}</style>
    <rect width="1000" height="1060" class="bg"/>
    <rect x="54" y="46" width="892" height="968" rx="28" class="card"/>
    <rect x="54" y="46" width="892" height="12" rx="6" class="blue"/>
    <text x="100" y="121" class="brand">DeshMate</text>
    <text x="100" y="156" class="sub">বাংলাদেশকে জানুন, জীবনের হিসাব করুন</text>
    <text x="100" y="225" class="title">${escapeXml(estimate.origin.nameBangla)} → ${escapeXml(estimate.destination.nameBangla)}</text>
    <text x="100" y="270" class="body">প্রায় ${escapeXml(estimate.costs.distanceKm)} কিমি · ${escapeXml(estimate.costs.assumptions.days)} দিন · ${escapeXml(estimate.costs.assumptions.travelers)} জন</text>
    <text x="100" y="365" class="title">খরচের বিস্তারিত</text>
    ${rows}
    <rect x="100" y="832" width="760" height="99" rx="18" class="blue"/>
    <text x="128" y="873" class="totalLabel">মোট আনুমানিক খরচ</text>
    <text x="128" y="914" class="total">${escapeXml(formatCurrency(estimate.costs.total.min))} – ${escapeXml(formatCurrency(estimate.costs.total.max))}</text>
    <text x="100" y="970" class="footer">জনপ্রতি: ${escapeXml(formatCurrency(estimate.costs.perPerson.min))} – ${escapeXml(formatCurrency(estimate.costs.perPerson.max))}</text>
    <text x="500" y="1026" text-anchor="middle" class="footer" font-weight="700">MD INJAMAM UL HAQUE</text>
    <text x="500" y="1048" text-anchor="middle" class="footer">© 2026 DeshMate. সর্বস্বত্ব সংরক্ষিত।</text>
  </svg>`

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    const image = new window.Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 2000
        canvas.height = 2120
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas is not available')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl)
          if (!blob) {
            reject(new Error('Image export failed'))
            return
          }
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = `deshmate-tour-${estimate.destination.id}.${format.toLowerCase()}`
          link.click()
          window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
          resolve()
        }, format === 'JPG' ? 'image/jpeg' : 'image/png', .95)
      } catch (error) {
        URL.revokeObjectURL(objectUrl)
        reject(error)
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not render the tour image'))
    }
    image.src = objectUrl
  })
}

function TourCard({ tour, onView, onEdit, onDelete, onShare }) {
  const origin = findLocation(tour.originId)
  const destination = findLocation(tour.destinationId)
  if (!origin || !destination) return null
  const estimate = calculateAutomaticTravelEstimate({
    origin,
    destination,
    days: tour.days,
    travelers: tour.travelers,
  })

  return (
    <article className="saved-tour-card">
      <div className="saved-tour-card-top">
        <span className="saved-tour-icon"><Compass size={18} /></span>
        <span className="saved-tour-date">{Number.isFinite(new Date(tour.createdAt).getTime()) ? new Date(tour.createdAt).toLocaleDateString('bn-BD') : 'তারিখ অজানা'}</span>
      </div>
      <h3>{tour.name}</h3>
      <p className="saved-tour-route">{origin.nameBangla} <ArrowRight size={14} /> {destination.nameBangla}</p>
      <p className="saved-tour-meta">{tour.days} দিন · {tour.travelers} জন</p>
      <p className="saved-tour-price">{formatCurrency(estimate.total.min)} – {formatCurrency(estimate.total.max)}</p>
      <div className="saved-tour-actions">
        <button type="button" onClick={() => onView(tour)}><Compass size={14} /> View</button>
        <button type="button" onClick={() => onEdit(tour)}><Pencil size={14} /> Edit</button>
        <button type="button" onClick={() => onShare(tour)}><Share2 size={14} /> Share</button>
        <button type="button" className="delete-tour-button" onClick={() => onDelete(tour.id)} aria-label={`${tour.name} মুছুন`}><Trash2 size={14} /></button>
      </div>
    </article>
  )
}

function createTourRecord({ existing, id, name, origin, destination, days, travelers }) {
  return {
    id: id || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    name,
    originId: origin.id,
    destinationId: destination.id,
    days,
    travelers,
    createdAt: existing?.createdAt || new Date().toISOString(),
  }
}

export default function TravelPlannerPage() {
  const [searchParams] = useSearchParams()
  const initialOrigin = findLocation(searchParams.get('from'))?.nameEnglish || ''
  const initialDestination = findLocation(searchParams.get('to'))?.nameEnglish || ''
  const initialDays = searchParams.get('days')
  const initialTravelers = searchParams.get('travelers')
  const [draft, setDraft] = useState(() => ({
    origin: initialOrigin,
    destination: initialDestination,
    days: initialDays && Number(initialDays) > 0 ? String(Math.min(365, Math.round(Number(initialDays)))) : '2',
    travelers: initialTravelers && Number(initialTravelers) > 0 ? String(Math.min(1000, Math.round(Number(initialTravelers)))) : '2',
  }))
  const [hasPlan, setHasPlan] = useState(Boolean(initialOrigin && initialDestination && initialOrigin !== initialDestination))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [nameEditorOpen, setNameEditorOpen] = useState(false)
  const [tourName, setTourName] = useState('')
  const [editingTourId, setEditingTourId] = useState('')
  const [savedState, setSavedState] = useState(readSavedTours)
  const { tours: savedTours, error: storageError } = savedState

  const origin = findLocation(draft.origin)
  const destination = findLocation(draft.destination)
  const estimate = hasPlan && origin && destination && origin.id !== destination.id
    ? {
      origin,
      destination,
      costs: calculateAutomaticTravelEstimate({
        origin,
        destination,
        days: draft.days,
        travelers: draft.travelers,
      }),
    }
    : null

  function createPlan(event) {
    event.preventDefault()
    if (!origin || !destination) {
      setError('তালিকা থেকে যাত্রার শুরু ও গন্তব্য বেছে নিন।')
      setHasPlan(false)
      return
    }
    if (origin.id === destination.id) {
      setError('যাত্রার শুরু ও গন্তব্য আলাদা করে বেছে নিন।')
      setHasPlan(false)
      return
    }
    setDraft((current) => ({
      ...current,
      origin: origin.nameEnglish,
      destination: destination.nameEnglish,
      days: String(Math.max(1, Math.round(Number(current.days) || 1))),
      travelers: String(Math.max(1, Math.round(Number(current.travelers) || 1))),
    }))
    setError('')
    setNotice('')
    setHasPlan(true)
    setNameEditorOpen(false)
    setEditingTourId('')
  }

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
    setNotice('')
    if (key === 'origin' || key === 'destination') setError('')
  }

  function persistTours(nextTours) {
    try {
      localStorage.setItem(SAVED_TOURS_KEY, JSON.stringify(nextTours))
      setSavedState({ tours: nextTours, error: '' })
      return true
    } catch {
      setSavedState((current) => ({
        ...current,
        error: 'ট্যুরটি সংরক্ষণ করা যায়নি। ব্রাউজারের storage অনুমতি ও খালি জায়গা পরীক্ষা করুন।',
      }))
      return false
    }
  }

  function startSaving() {
    if (!estimate) return
    setTourName(`${estimate.origin.nameEnglish} → ${estimate.destination.nameEnglish}`)
    setNameEditorOpen(true)
    setNotice('')
  }

  function saveTour(event) {
    event.preventDefault()
    if (!estimate) return
    const name = tourName.trim()
    if (!name) {
      setNotice('ট্যুরের একটি নাম লিখুন।')
      return
    }
    const days = Number(draft.days)
    const travelers = Number(draft.travelers)
    if (!Number.isSafeInteger(days) || days < 1 || days > 365
      || !Number.isSafeInteger(travelers) || travelers < 1 || travelers > 1000) {
      setNotice('দিনের সংখ্যা ১–৩৬৫ এবং ভ্রমণকারীর সংখ্যা ১–১০০০-এর মধ্যে পূর্ণসংখ্যা হতে হবে।')
      return
    }
    const existing = savedTours.find((tour) => tour.id === editingTourId)
    const tour = createTourRecord({
      existing,
      id: editingTourId,
      name,
      origin: estimate.origin,
      destination: estimate.destination,
      days: estimate.costs.assumptions.days,
      travelers: estimate.costs.assumptions.travelers,
    })
    const nextTours = existing
      ? savedTours.map((item) => item.id === existing.id ? tour : item)
      : [tour, ...savedTours]
    if (persistTours(nextTours)) {
      setEditingTourId('')
      setNameEditorOpen(false)
      setNotice(existing ? 'সংরক্ষিত ট্যুরটি আপডেট হয়েছে।' : 'ট্যুরটি আপনার ব্রাউজারে সংরক্ষিত হয়েছে।')
    }
  }

  function loadTour(tour, edit = false) {
    setDraft({
      origin: findLocation(tour.originId)?.nameEnglish || tour.originId,
      destination: findLocation(tour.destinationId)?.nameEnglish || tour.destinationId,
      days: String(tour.days),
      travelers: String(tour.travelers),
    })
    setHasPlan(true)
    setEditingTourId(edit ? tour.id : '')
    setError('')
    setNotice(edit ? 'ট্যুরের তথ্য পরিবর্তন করুন; হিসাব সঙ্গে সঙ্গে আপডেট হবে।' : 'সংরক্ষিত ট্যুরটি খোলা হয়েছে।')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function deleteTour(id) {
    const nextTours = savedTours.filter((tour) => tour.id !== id)
    if (persistTours(nextTours)) setNotice('সংরক্ষিত ট্যুরটি মুছে ফেলা হয়েছে।')
  }

  function getTourLink(selectedEstimate) {
    const url = new URL('/travel-planner', window.location.origin)
    url.searchParams.set('from', selectedEstimate.origin.id)
    url.searchParams.set('to', selectedEstimate.destination.id)
    url.searchParams.set('days', selectedEstimate.costs.assumptions.days)
    url.searchParams.set('travelers', selectedEstimate.costs.assumptions.travelers)
    return url.toString()
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        return
      } catch {
        // Continue to the browser's built-in copy fallback.
      }
    }
    const input = document.createElement('textarea')
    input.value = text
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.append(input)
    input.select()
    const copied = document.execCommand('copy')
    input.remove()
    if (!copied) throw new Error('Clipboard copy is unavailable')
  }

  async function shareEstimate(selectedEstimate) {
    const text = buildTourDetails(selectedEstimate)
    const url = getTourLink(selectedEstimate)
    if (navigator.share) {
      try {
        await navigator.share({ title: `DeshMate · ${selectedEstimate.destination.nameEnglish}`, text, url })
        setNotice('ট্যুর প্ল্যান শেয়ার করা হয়েছে।')
        return
      } catch (shareError) {
        if (shareError.name === 'AbortError') return
      }
    }
    try {
      await copyText(`${text}\n${url}`)
      setNotice('ট্যুরের বিবরণ ও লিংক কপি হয়েছে।')
    } catch {
      setNotice('শেয়ার বা কপি করা যায়নি। ব্রাউজারের clipboard অনুমতি পরীক্ষা করুন।')
    }
  }

  async function shareSavedTour(tour) {
    const savedOrigin = findLocation(tour.originId)
    const savedDestination = findLocation(tour.destinationId)
    if (!savedOrigin || !savedDestination) return
    const selectedEstimate = {
      origin: savedOrigin,
      destination: savedDestination,
      costs: calculateAutomaticTravelEstimate({
        origin: savedOrigin,
        destination: savedDestination,
        days: tour.days,
        travelers: tour.travelers,
      }),
    }
    await shareEstimate(selectedEstimate)
  }

  async function exportImage(format) {
    try {
      await downloadTourImage(estimate, format)
      setNotice(`${format} ফাইল ডাউনলোড হয়েছে।`)
    } catch {
      setNotice(`${format} তৈরি করা যায়নি। অন্য browser-এ আবার চেষ্টা করুন।`)
    }
  }

  const details = estimate ? buildTourDetails(estimate) : ''

  return (
    <section className="page-shell travel-page">
      <div className="page-heading">
        <span className="eyebrow"><Compass size={14} /> ভ্রমণ পরিকল্পনাকারী</span>
        <h1>আপনার পরের ভ্রমণ, <span>পরিকল্পিত</span></h1>
        <p>কোথা থেকে, কোথায়, কতদিন ও কতজন—তথ্য দিলেই সম্ভাব্য রুট ও বাজেট তৈরি হবে।</p>
      </div>

      <form className="calculator-form-panel travel-form-panel" onSubmit={createPlan}>
        <div className="form-panel-heading">
          <span className="calculator-icon"><MapPin size={20} /></span>
          <div><h2>আপনার ভ্রমণের তথ্য</h2><p>বাকি খরচ ও বাজেট DeshMate নিজে অনুমান করবে।</p></div>
        </div>
        <datalist id="travel-locations">
          {locationOptions.map((location) => (
            <option key={location.id} value={location.nameEnglish}>{location.nameBangla} · {location.nameEnglish}</option>
          ))}
        </datalist>
        <div className="travel-location-fields">
          <label className="form-field">
            <span>📍 কোথা থেকে যাবেন</span>
            <input className="plain-input" list="travel-locations" value={draft.origin}
              onChange={(event) => updateDraft('origin', event.target.value)}
              placeholder="যেমন: Dhaka বা ঢাকা" autoComplete="off" required />
          </label>
          <span className="travel-direction" aria-hidden="true"><ArrowRight size={19} /></span>
          <label className="form-field">
            <span>📍 কোথায় যাবেন</span>
            <input className="plain-input" list="travel-locations" value={draft.destination}
              onChange={(event) => updateDraft('destination', event.target.value)}
              placeholder="যেমন: Cox's Bazar বা কক্সবাজার" autoComplete="off" required />
          </label>
        </div>
        <div className="trip-basics">
          <label className="form-field">
            <span>📅 কত দিন থাকবেন<small>১–৩৬৫ দিন</small></span>
            <div className="input-with-unit"><input type="number" min="1" max="365" step="1" value={draft.days}
              onChange={(event) => updateDraft('days', event.target.value)} required /><span>দিন</span></div>
          </label>
          <label className="form-field">
            <span>👥 কতজন যাবেন<small>১–১০০০ জন</small></span>
            <div className="input-with-unit"><input type="number" min="1" max="1000" step="1" value={draft.travelers}
              onChange={(event) => updateDraft('travelers', event.target.value)} required /><span>জন</span></div>
          </label>
        </div>
        {error && <p className="travel-error" role="alert">{error}</p>}
        <button className="button button-primary travel-submit" type="submit">
          {editingTourId ? 'পরিবর্তিত ট্যুর প্ল্যান দেখুন' : 'ট্যুর প্ল্যান তৈরি করুন'} <ArrowRight size={17} />
        </button>
      </form>

      {estimate && (
        <div className="tour-export">
          <div className="tour-export-brand">
            <strong>DeshMate</strong><span>বাংলাদেশকে জানুন, জীবনের হিসাব করুন</span>
          </div>
          <div className="travel-planner-layout travel-results-layout">
            <section className="travel-route-card">
              <div className="summary-top"><span className="summary-icon"><Compass size={21} /></span><span className="eyebrow">আপনার ভ্রমণ রুট</span></div>
              <h2>{estimate.origin.nameBangla} <ArrowRight size={19} /> {estimate.destination.nameBangla}</h2>
              <div className="route-distance">
                <MapPin size={17} />
                <span><small>আনুমানিক একমুখী সড়ক দূরত্ব</small><strong>প্রায় {estimate.costs.distanceKm.toLocaleString('bn-BD')} কিমি</strong></span>
              </div>
              <p className="route-assumption">
                {estimate.costs.distanceIsApproximate
                  ? 'কোনো একটি স্থানের সুনির্দিষ্ট অবস্থান না থাকায় তার বিভাগীয় কেন্দ্র ধরে দূরত্ব অনুমান করা হয়েছে।'
                  : 'সড়ক দূরত্ব সরলরেখার দূরত্বের ওপর আনুমানিক সড়ক-ঘুরপথ গুণক প্রয়োগ করে হিসাব করা হয়েছে।'}
                {' '}এটি লাইভ ম্যাপ রুট নয়।
              </p>
              <div className="estimate-assumptions">
                আনুমানিক {estimate.costs.assumptions.days} দিন · {estimate.costs.assumptions.travelers} জন · {estimate.costs.assumptions.nights} রাত · {estimate.costs.assumptions.rooms}টি কক্ষ
              </div>
            </section>

            <aside className="travel-summary" aria-live="polite">
              <div className="summary-top"><span className="summary-icon"><Compass size={21} /></span><span className="eyebrow">আনুমানিক মোট খরচ</span></div>
              <div className="automatic-budget-range">
                <div><small>সর্বনিম্ন আনুমানিক খরচ</small><strong>{formatCurrency(estimate.costs.total.min)}</strong></div>
                <span aria-hidden="true">–</span>
                <div><small>সর্বোচ্চ আনুমানিক খরচ</small><strong>{formatCurrency(estimate.costs.total.max)}</strong></div>
              </div>
              <h3 className="breakdown-title">খরচের বিস্তারিত</h3>
              <div className="summary-breakdown">
                {costLabels.map(([key, label]) => (
                  <div key={key}>
                    <span>{label}</span>
                    <strong>{formatCurrency(estimate.costs.breakdown[key].min)} – {formatCurrency(estimate.costs.breakdown[key].max)}</strong>
                  </div>
                ))}
              </div>
              <div className="per-person-cost">
                <span>জনপ্রতি আনুমানিক খরচ</span>
                <strong>{formatCurrency(estimate.costs.perPerson.min)} – {formatCurrency(estimate.costs.perPerson.max)}</strong>
              </div>
              <p className="result-note">পরিকল্পনা-সহায়ক আনুমানিক হিসাব। প্রকৃত ভাড়া ও খরচ ভ্রমণের সময় অনুযায়ী বদলাতে পারে।</p>
            </aside>
          </div>

          <div className="tour-actions">
            {!nameEditorOpen ? (
              <button className="button button-primary" type="button" onClick={startSaving}>💾 Save Tour Plan</button>
            ) : (
              <form className="tour-save-form" onSubmit={saveTour}>
                <label htmlFor="tour-name">ট্যুরের নাম</label>
                <input id="tour-name" value={tourName} onChange={(event) => setTourName(event.target.value)} maxLength="70" required />
                <button className="button button-primary" type="submit">{editingTourId ? 'পরিবর্তন সংরক্ষণ' : 'সংরক্ষণ'}</button>
                <button className="button button-secondary tour-cancel-save" type="button" onClick={() => setNameEditorOpen(false)}>বাতিল</button>
              </form>
            )}
            <button className="button button-secondary" type="button" onClick={() => shareEstimate(estimate)}><Share2 size={16} /> Share Tour Plan</button>
            <button className="button button-secondary" type="button" onClick={() => copyText(details).then(() => setNotice('ট্যুরের বিবরণ কপি হয়েছে।')).catch(() => setNotice('বিবরণ কপি করা যায়নি।'))}><Copy size={16} /> Copy Details</button>
            <button className="button button-secondary" type="button" onClick={() => window.print()}><FileText size={16} /> PDF</button>
            <button className="button button-secondary" type="button" onClick={() => exportImage('PNG')}><Image size={16} /> PNG</button>
            <button className="button button-secondary" type="button" onClick={() => exportImage('JPG')}><Image size={16} /> JPG</button>
          </div>
          {notice && <p className="tour-notice" role="status">{notice}</p>}
          <p className="tour-export-footer">© 2026 DeshMate. সর্বস্বত্ব সংরক্ষিত। | MD INJAMAM UL HAQUE</p>
        </div>
      )}

      {(savedTours.length > 0 || storageError) && (
        <section className="saved-tours-section">
          <div className="section-heading">
            <div><span className="eyebrow">আপনার পরিকল্পনা</span><h2>My Saved Tours</h2><p>এই browser-এ সংরক্ষিত ভ্রমণ পরিকল্পনাগুলো।</p></div>
          </div>
          {storageError && <p className="travel-error" role="alert">{storageError}</p>}
          {savedState.error && savedState.error !== storageError && <p className="travel-error" role="alert">{savedState.error}</p>}
          <div className="saved-tour-grid">
            {savedTours.map((tour) => (
              <TourCard key={tour.id} tour={tour}
                onView={(selectedTour) => loadTour(selectedTour)}
                onEdit={(selectedTour) => loadTour(selectedTour, true)}
                onDelete={deleteTour}
                onShare={shareSavedTour}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  )
}
