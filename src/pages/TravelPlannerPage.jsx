import { lazy, Suspense, useState } from 'react'
import {
  ArrowRight,
  Compass,
  Copy,
  Image,
  MapPin,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import districts from '../data/districts.js'
import { calculateAutomaticTravelEstimate, formatCurrency } from '../utils/calculations.js'

const PdfExportActions = lazy(() => import('../components/PdfExportActions.jsx'))

const SAVED_TOURS_KEY = 'deshmate-saved-tours'
const kuakata = {
  id: 'kuakata',
  nameBangla: 'কুয়াকাটা',
  nameEnglish: 'Kuakata',
  divisionEnglish: 'Barishal',
  mapQuery: 'Kuakata Sea Beach, Patuakhali, Bangladesh',
  touristSpots: districts.find((district) => district.id === 'patuakhali')?.touristSpots
    .filter((spot) => spot.name === 'Kuakata') ?? [],
}
const locationOptions = [...districts, kuakata]
const costLabels = [
  ['transport', 'যাতায়াত'],
  ['accommodation', 'হোটেল / থাকা'],
  ['food', 'খাবার'],
  ['localTransport', 'স্থানীয় যাতায়াত'],
  ['other', 'অন্যান্য প্রয়োজনীয় খরচ'],
]
const tagline = 'বাংলাদেশকে জানুন, জীবনের হিসাব করুন'

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

function getDestinationMapQuery(destination) {
  return destination.mapQuery || `${destination.nameEnglish}, Bangladesh`
}

function getDestinationPlaces(destination) {
  return (destination.touristSpots || [])
    .map((spot) => typeof spot === 'string' ? spot : spot.nameBn || spot.name)
    .filter(Boolean)
}

function getAverage(range) {
  return Math.round((range.min + range.max) / 2)
}

function buildTourDetails(estimate, url) {
  const route = `${estimate.origin.nameEnglish} → ${estimate.destination.nameEnglish}`
  const breakdown = costLabels
    .map(([key, label]) => `${label}: ${formatCurrency(estimate.costs.breakdown[key].min)} – ${formatCurrency(estimate.costs.breakdown[key].max)}`)
    .join('\n')
  const places = getDestinationPlaces(estimate.destination)
  return [
    `DeshMate — ${route}`,
    tagline,
    `রুট: ${estimate.origin.nameBangla} → ${estimate.destination.nameBangla}`,
    `সময়: ${estimate.costs.assumptions.days} দিন · ${estimate.costs.assumptions.travelers} জন`,
    breakdown,
    'কার্যক্রম / প্রবেশ ফি: নির্দিষ্ট মূল্য মোট অনুমানে অন্তর্ভুক্ত নয়',
    `আনুমানিক বাজেট: সর্বনিম্ন ${formatCurrency(estimate.costs.total.min)} · গড় ${formatCurrency(getAverage(estimate.costs.total))} · সর্বোচ্চ ${formatCurrency(estimate.costs.total.max)}`,
    `জনপ্রতি: ${formatCurrency(estimate.costs.perPerson.min)} – ${formatCurrency(estimate.costs.perPerson.max)}`,
    ...(places.length ? [`ঘোরার স্থান: ${places.slice(0, 5).join(', ')}`] : []),
    `মানচিত্র: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getDestinationMapQuery(estimate.destination))}`,
    `পরিকল্পনার লিংক: ${url}`,
  ].join('\n')
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
  const [shareOpen, setShareOpen] = useState(false)
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
    const url = new URL('/travel-planner', 'https://deshmate.pages.dev')
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

  async function shareWithApps(selectedEstimate) {
    const url = getTourLink(selectedEstimate)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${selectedEstimate.origin.nameEnglish} থেকে ${selectedEstimate.destination.nameEnglish} — DeshMate Travel Plan`,
          text: buildTourDetails(selectedEstimate, url),
          url,
        })
        setNotice('ট্যুর প্ল্যান শেয়ার করা হয়েছে।')
        return
      } catch (shareError) {
        if (shareError.name === 'AbortError') return
      }
    }
    try {
      await copyText(url)
      setNotice('এই ভ্রমণ পরিকল্পনার লিংক কপি হয়েছে। Instagram, TikTok বা Messenger-এ লিংকটি paste করুন।')
    } catch {
      setNotice('লিংক কপি করা যায়নি। ব্রাউজারের clipboard অনুমতি পরীক্ষা করুন।')
    }
  }

  async function copyPlanLink(selectedEstimate) {
    try {
      await copyText(getTourLink(selectedEstimate))
      setNotice('এই ভ্রমণ পরিকল্পনার লিংক কপি হয়েছে।')
    } catch {
      setNotice('লিংক কপি করা যায়নি। ব্রাউজারের clipboard অনুমতি পরীক্ষা করুন।')
    }
  }

  function shareSavedTour(tour) {
    loadTour(tour)
    setShareOpen(true)
  }

  async function exportImage(format) {
    try {
      const { downloadTourImage } = await import('../utils/travelShareImage.js')
      await downloadTourImage(estimate, format)
      setNotice(`${format} ফাইল ডাউনলোড হয়েছে।`)
    } catch {
      setNotice(`${format} তৈরি করা যায়নি। অন্য browser-এ আবার চেষ্টা করুন।`)
    }
  }

  const tourLink = estimate ? getTourLink(estimate) : ''
  const details = estimate ? buildTourDetails(estimate, tourLink) : ''
  const destinationPlaces = estimate ? getDestinationPlaces(estimate.destination) : []
  const destinationMapUrl = estimate
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getDestinationMapQuery(estimate.destination))}`
    : ''
  const destinationDistrict = estimate
    ? districts.find((district) => district.id === estimate.destination.id)
    : null
  const travelPdfSections = estimate ? [
    {
      heading: 'ভ্রমণের বিবরণ',
      rows: [
        { label: 'যাত্রার শুরু', value: `${estimate.origin.nameBangla} (${estimate.origin.nameEnglish})` },
        { label: 'গন্তব্য', value: `${estimate.destination.nameBangla} (${estimate.destination.nameEnglish})` },
        { label: 'ভ্রমণকারী', value: `${estimate.costs.assumptions.travelers} জন` },
        { label: 'সময়কাল', value: `${estimate.costs.assumptions.days} দিন · ${estimate.costs.assumptions.nights} রাত` },
        { label: 'কক্ষের হিসাব', value: `${estimate.costs.assumptions.rooms}টি (প্রতি কক্ষে সর্বোচ্চ ২ জন ধরে)` },
        { label: 'আনুমানিক একমুখী সড়ক দূরত্ব', value: `${estimate.costs.distanceKm.toLocaleString('bn-BD')} কিমি` },
      ],
      paragraph: 'ভ্রমণের তারিখ, নির্দিষ্ট পরিবহন, হোটেল, রেস্তোরাঁ বা কার্যক্রমের নির্বাচন এই Planner-এ নেই; সেগুলোর কোনো তথ্য বা মূল্য এই পরিকল্পনায় যোগ করা হয়নি।',
    },
    {
      heading: 'আনুমানিক খরচের বিস্তারিত',
      rows: [
        ...costLabels.map(([key, label]) => ({
          label,
          value: `${formatCurrency(estimate.costs.breakdown[key].min)} – ${formatCurrency(estimate.costs.breakdown[key].max)}`,
        })),
        { label: 'কার্যক্রম / প্রবেশ ফি', value: 'মোট অনুমানে অন্তর্ভুক্ত নয়' },
        { label: 'সর্বনিম্ন মোট', value: formatCurrency(estimate.costs.total.min) },
        { label: 'গড় মোট', value: formatCurrency(getAverage(estimate.costs.total)) },
        { label: 'সর্বোচ্চ মোট', value: formatCurrency(estimate.costs.total.max) },
        { label: 'জনপ্রতি সর্বনিম্ন', value: formatCurrency(estimate.costs.perPerson.min) },
        { label: 'জনপ্রতি গড়', value: formatCurrency(getAverage(estimate.costs.perPerson)) },
        { label: 'জনপ্রতি সর্বোচ্চ', value: formatCurrency(estimate.costs.perPerson.max) },
        { label: 'দৈনিক গড় (মোট)', value: formatCurrency(getAverage(estimate.costs.total) / estimate.costs.assumptions.days) },
      ],
      paragraph: 'এগুলো পরিকল্পনা-সহায়ক অনুমান, লাইভ ভাড়া বা নিশ্চিত মূল্য নয়। দূরত্ব সরলরেখা ও আনুমানিক সড়ক-ঘুরপথের হিসাব; এটি লাইভ ম্যাপ রুট নয়।',
    },
    ...(destinationDistrict?.overview ? [{
      heading: 'গন্তব্য পরিচিতি',
      paragraph: destinationDistrict.overview,
    }] : []),
    ...(destinationPlaces.length ? [{
      heading: 'জেলা গাইডে থাকা দর্শনীয় স্থান',
      items: (estimate.destination.touristSpots || []).map((spot) => {
        if (typeof spot === 'string') return spot
        return [
          spot.nameBn || spot.name,
          spot.description,
          spot.location ? `অবস্থান: ${spot.location}` : '',
          spot.howToReach ? `যাতায়াত: ${spot.howToReach}` : '',
        ].filter(Boolean).join(' — ')
      }),
      paragraph: 'এগুলো গন্তব্য জেলার তথ্যভান্ডারে থাকা স্থান; ব্যবহারকারী-নির্বাচিত itinerary নয়।',
    }] : []),
    ...(destinationDistrict?.famousFoods?.length ? [{
      heading: 'জেলা গাইডে থাকা খাবার',
      items: destinationDistrict.famousFoods.map((food) => typeof food === 'string' ? food : [food.nameBn || food.name, food.description].filter(Boolean).join(' — ')),
      paragraph: 'এই Planner-এ খাবার বা রেস্তোরাঁ নির্বাচন করা হয়নি।',
    }] : []),
    {
      heading: 'মানচিত্র ও উৎস',
      links: [
        { title: `${estimate.destination.nameBangla} মানচিত্রে দেখুন`, url: destinationMapUrl },
        ...(destinationDistrict?.sources || []).map((source) => ({ title: source.title, url: source.url })),
      ],
    },
  ] : []

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
          <section className="travel-share-card" aria-label="শেয়ার করার ভ্রমণ কার্ড">
            <div className="travel-share-hero">
              <span className="travel-share-kicker">DESHMATE · TRAVEL PLAN</span>
              <span className="travel-share-compass" aria-hidden="true"><Compass size={36} /></span>
              <p className="travel-share-tagline">{tagline}</p>
              <h2>{estimate.origin.nameBangla} <ArrowRight size={19} /> {estimate.destination.nameBangla}</h2>
              <p className="travel-share-meta"><span>{estimate.costs.assumptions.travelers} জন</span><span>{estimate.costs.assumptions.days} দিন</span><span>{estimate.costs.assumptions.nights} রাত</span></p>
              <a className="travel-map-link" href={destinationMapUrl} target="_blank" rel="noreferrer"><MapPin size={15} /> মানচিত্র দেখুন</a>
            </div>
            <div className="travel-share-content">
              {destinationPlaces.length > 0 && (
                <section className="travel-share-places">
                  <h3>ঘোরার স্থান</h3>
                  <ul>{destinationPlaces.slice(0, 4).map((place, index) => <li key={`${place}-${index}`}>{place}</li>)}</ul>
                  {destinationPlaces.length > 4 && <small>আরও {destinationPlaces.length - 4}টি স্থান জেলার গাইডে দেখুন</small>}
                </section>
              )}
              <section className="travel-share-costs">
                <h3>আনুমানিক খরচ</h3>
                {costLabels.map(([key, label]) => (
                  <div key={key}><span>{label}</span><strong>{formatCurrency(estimate.costs.breakdown[key].min)} – {formatCurrency(estimate.costs.breakdown[key].max)}</strong></div>
                ))}
                <div><span>কার্যক্রম / প্রবেশ ফি</span><strong>নির্দিষ্ট মূল্য অন্তর্ভুক্ত নয়</strong></div>
              </section>
              <div className="travel-share-total">
                <span>সর্বনিম্ন</span><strong>{formatCurrency(estimate.costs.total.min)}</strong>
                <span>গড়</span><strong>{formatCurrency(getAverage(estimate.costs.total))}</strong>
                <span>সর্বোচ্চ</span><strong>{formatCurrency(estimate.costs.total.max)}</strong>
              </div>
              <a className="travel-share-permalink" href={tourLink}>{tourLink}</a>
              <small className="travel-share-footnote">DeshMate-এর আনুমানিক পরিকল্পনা · প্রকৃত খরচ ভ্রমণের সময় অনুযায়ী বদলাতে পারে</small>
            </div>
          </section>
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

          <Suspense fallback={null}><PdfExportActions
            title={`${estimate.origin.nameEnglish} থেকে ${estimate.destination.nameEnglish} — ভ্রমণ পরিকল্পনা`}
            filename={`DeshMate-Travel-Plan-${estimate.origin.nameEnglish}-to-${estimate.destination.nameEnglish}`}
            sections={travelPdfSections}
            shareUrl={tourLink}
            shareSummary={`${estimate.origin.nameBangla} থেকে ${estimate.destination.nameBangla} — ${estimate.costs.assumptions.days} দিনের, ${estimate.costs.assumptions.travelers} জনের পরিকল্পনা। সর্বনিম্ন ${formatCurrency(estimate.costs.total.min)} · গড় ${formatCurrency(getAverage(estimate.costs.total))} · সর্বোচ্চ ${formatCurrency(estimate.costs.total.max)}।`}
          /></Suspense>

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
            <button className="button button-secondary travel-share-button" type="button" aria-expanded={shareOpen} aria-controls="travel-share-options" onClick={() => setShareOpen((open) => !open)}><Share2 size={16} /> শেয়ার করুন</button>
            <button className="button button-secondary" type="button" onClick={() => copyText(details).then(() => setNotice('ট্যুরের বিবরণ কপি হয়েছে।')).catch(() => setNotice('বিবরণ কপি করা যায়নি।'))}><Copy size={16} /> Copy Details</button>
            <button className="button button-secondary" type="button" onClick={() => exportImage('PNG')}><Image size={16} /> PNG</button>
            <button className="button button-secondary" type="button" onClick={() => exportImage('JPG')}><Image size={16} /> JPG</button>
          </div>
          {shareOpen && (
            <section className="travel-share-options" id="travel-share-options" aria-label="ভ্রমণ পরিকল্পনা শেয়ার">
              <div>
                <h3>আপনার ভ্রমণ পরিকল্পনা শেয়ার করুন</h3>
                <p>লিংক খুললে একই গন্তব্য, ভ্রমণকারী ও দিনের হিসাব দেখা যাবে।</p>
              </div>
              <div className="travel-share-actions">
                <button className="travel-social-button" type="button" onClick={() => shareWithApps(estimate)}><Share2 size={16} /> Messenger · Instagram · TikTok · আরও অ্যাপ</button>
                <a className="travel-social-button" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tourLink)}&quote=${encodeURIComponent(details)}`} target="_blank" rel="noreferrer">f <span>Facebook</span></a>
                <a className="travel-social-button" href={`https://wa.me/?text=${encodeURIComponent(details)}`} target="_blank" rel="noreferrer">◉ <span>WhatsApp</span></a>
                <button className="travel-social-button" type="button" onClick={() => copyPlanLink(estimate)}><Copy size={16} /> লিংক কপি</button>
                <button className="travel-social-button" type="button" onClick={() => exportImage('PNG')}><Image size={16} /> শেয়ার কার্ড ছবি ডাউনলোড</button>
              </div>
              <p className="travel-share-hint">Messenger, Instagram ও TikTok-এর জন্য সমর্থিত ফোনে “আরও অ্যাপ” থেকে বেছে নিন। অন্যথায় কার্ডটি ডাউনলোড করে অ্যাপে যোগ করুন।</p>
            </section>
          )}
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
