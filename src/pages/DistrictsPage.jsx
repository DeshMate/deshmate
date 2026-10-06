import { lazy, Suspense, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Search } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import districts from '../data/districts.js'
import { formatCurrency } from '../utils/calculations.js'

const PdfExportActions = lazy(() => import('../components/PdfExportActions.jsx'))

function DistrictCard({ district }) {
  return (
    <Link className="district-card" to={`/districts/${district.id}`}>
      <span className="district-card-top"><MapPin size={16} /><span>{district.divisionBangla} বিভাগ</span></span>
      <strong>{district.nameBangla}</strong><small>{district.nameEnglish}</small>
      <span className="district-card-footer">{district.attractions.slice(0, 2).join(' · ')}<ArrowRight size={15} /></span>
    </Link>
  )
}

export default function DistrictsPage() {
  const [query, setQuery] = useState('')
  const [division, setDivision] = useState('সব বিভাগ')
  const divisions = useMemo(() => ['সব বিভাগ', ...new Set(districts.map((district) => district.divisionBangla))], [])
  const filtered = useMemo(() => districts.filter((district) => {
    const matchesDivision = division === 'সব বিভাগ' || district.divisionBangla === division
    const normalized = query.trim().toLocaleLowerCase()
    const matchesQuery = !normalized || [district.nameBangla, district.nameEnglish, district.divisionBangla, ...district.attractions]
      .some((value) => value.toLocaleLowerCase().includes(normalized))
    return matchesDivision && matchesQuery
  }), [division, query])

  return (
    <section className="page-shell">
      <div className="page-heading">
        <span className="eyebrow">বাংলাদেশ এক্সপ্লোরার</span>
        <h1>৬৪ জেলায় <span>৬৪ গল্প</span></h1>
        <p>আপনার পরের গন্তব্যটি বেছে নিন। জেলার দর্শনীয় স্থান, খাবার, যাতায়াত ও বাজেট সম্পর্কে জানুন।</p>
      </div>
      <div className="district-controls district-controls-page">
        <label className="district-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="জেলা বা দর্শনীয় স্থান খুঁজুন..." aria-label="জেলা বা দর্শনীয় স্থান খুঁজুন" /></label>
        <label className="division-select"><span className="sr-only">বিভাগ বাছাই</span><select value={division} onChange={(event) => setDivision(event.target.value)}>{divisions.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <p className="result-count">{filtered.length}টি জেলা পাওয়া গেছে</p>
      <div className="district-card-grid district-card-grid-all">
        {filtered.map((district) => <DistrictCard district={district} key={district.id} />)}
        {!filtered.length && <div className="empty-state">মিল থাকা কোনো জেলা পাওয়া যায়নি। সার্চ বা বিভাগ পরিবর্তন করে দেখুন।</div>}
      </div>
    </section>
  )
}

export function DistrictDetailPage() {
  const { id } = useParams()
  const district = districts.find((item) => item.id === id)
  const [planDays, setPlanDays] = useState('one')

  if (!district) {
    return <section className="page-shell"><div className="empty-state"><Link to="/districts">জেলা তালিকা থেকে একটি জেলা বেছে নিন</Link></div></section>
  }

  const plans = {
    one: { label: '১ দিন', items: district.oneDayPlan || [] },
    two: { label: '২ দিন', items: district.twoDayPlan || [] },
    three: { label: '৩ দিন', items: district.threeDayPlan || [] },
  }
  const availablePlans = Object.entries(plans).filter(([, plan]) => plan.items.length > 0)
  const selectedPlanKey = plans[planDays]?.items.length ? planDays : availablePlans[0]?.[0]
  const budgetLabels = {
    transport: 'যাতায়াত',
    food: 'খাবার',
    accommodation: 'থাকা',
    entryFee: 'প্রবেশ ফি',
  }
  const budgetItems = Object.entries(district.budget || {})
    .filter(([key, range]) => budgetLabels[key] && range && Number.isFinite(range.min) && Number.isFinite(range.max))
  const transportDetails = typeof district.transport === 'string'
    ? [district.transport]
    : Object.values(district.transport || {}).filter((value) => typeof value === 'string' && value)
  const displayName = (item) => typeof item === 'string' ? item : item.nameBn || item.name
  const touristSpots = district.touristSpots || []
  const famousFoods = district.famousFoods || []
  const sources = district.sources || []
  const sourceTitles = new Map(sources.map((source) => [source.url, source.title]))
  const districtMapUrl = district.mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(district.mapQuery)}`
    : ''
  const districtPdfSections = [
    {
      heading: 'জেলা পরিচিতি',
      rows: [
        { label: 'জেলা', value: `${district.nameBangla} (${district.nameEnglish})` },
        { label: 'বিভাগ', value: `${district.divisionBangla} (${district.divisionEnglish})` },
        { label: 'ঘোরার ভালো সময়', value: district.bestTimeToVisit || '' },
      ],
      paragraph: district.overview || district.shortDescription || '',
    },
    ...(district.history ? [{ heading: 'ইতিহাস', paragraph: district.history }] : []),
    ...(touristSpots.length ? [{
      heading: 'দর্শনীয় স্থান',
      items: touristSpots.map((spot) => {
        if (typeof spot === 'string') return spot
        return [
          displayName(spot),
          spot.category,
          spot.description,
          spot.whyFamous ? `পরিচিতি: ${spot.whyFamous}` : '',
          spot.location ? `অবস্থান: ${spot.location}` : '',
          spot.howToReach ? `যাতায়াত: ${spot.howToReach}` : '',
        ].filter(Boolean).join(' — ')
      }),
      links: touristSpots
        .filter((spot) => typeof spot === 'object' && spot.mapQuery)
        .map((spot) => ({
          title: `${displayName(spot)} — মানচিত্র`,
          url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.mapQuery)}`,
        })),
    }] : []),
    ...(famousFoods.length ? [{
      heading: 'বিখ্যাত খাবার',
      items: famousFoods.map((food) => typeof food === 'string' ? food : [
        displayName(food),
        food.classification,
        food.description,
      ].filter(Boolean).join(' — ')),
    }] : []),
    ...(transportDetails.length ? [{ heading: 'যাতায়াত', items: transportDetails }] : []),
    ...(budgetItems.length ? [{
      heading: 'আনুমানিক বাজেট',
      rows: budgetItems.map(([key, range]) => ({
        label: budgetLabels[key],
        value: `${formatCurrency(range.min)} – ${formatCurrency(range.max)}${range.asOf ? ` (${range.asOf})` : ''}`,
      })),
    }] : []),
    ...(district.popularActivities?.length ? [{ heading: 'জনপ্রিয় কার্যক্রম', items: district.popularActivities }] : []),
    ...(selectedPlanKey ? [{
      heading: `${plans[selectedPlanKey].label} ভ্রমণসূচি`,
      items: plans[selectedPlanKey].items.map(displayName),
    }] : []),
    ...((sources.length || districtMapUrl) ? [{
      heading: 'মানচিত্র ও তথ্যসূত্র',
      links: [
        ...(districtMapUrl ? [{ title: `${district.nameBangla} মানচিত্রে দেখুন`, url: districtMapUrl }] : []),
        ...sources.map((source) => ({ title: source.title, url: source.url })),
      ],
    }] : []),
  ]

  return (
    <section className="page-shell district-detail-page">
      <Link className="back-link" to="/districts"><ArrowLeft size={16} /> সব জেলা</Link>
      <div className="detail-hero">
        <div className="detail-hero-copy">
          <span className="eyebrow">{district.divisionBangla} বিভাগ · জেলা পরিচিতি</span>
          <h1>{district.nameBangla} <span>{district.nameEnglish}</span></h1>
          {district.overview && <p>{district.overview}</p>}
          {district.bestTimeToVisit && <span className="district-best-time"><CalendarDays size={16} /> ঘোরার ভালো সময়: {district.bestTimeToVisit}</span>}
        </div>
        {budgetItems.length > 0 && (
          <div className="detail-budget-card">
            <span>আনুমানিক বাজেট</span>
            {budgetItems.map(([key, range]) => (
              <div key={key}><small>{budgetLabels[key]}</small><strong>{formatCurrency(range.min)}–{formatCurrency(range.max)}</strong></div>
            ))}
            <small>দামের তথ্য ও সময়কাল তথ্যসূত্রে দেখুন</small>
          </div>
        )}
      </div>
      <Suspense fallback={null}><PdfExportActions
        title={`${district.nameBangla} (${district.nameEnglish}) — জেলা তথ্য`}
        filename={`DeshMate-District-${district.nameEnglish}`}
        sections={districtPdfSections}
        shareUrl={`https://deshmate.pages.dev/district/${district.id}`}
        shareSummary={`${district.nameBangla} জেলার DeshMate তথ্য ও ভ্রমণ গাইড।`}
      /></Suspense>

      <div className="detail-content-grid">
        {touristSpots.length > 0 && (
          <article className="info-panel">
            <span className="eyebrow">ঘুরে দেখুন</span><h2>দর্শনীয় স্থান</h2>
            <div className="verified-item-list">
              {touristSpots.map((spot, index) => (
                <div className="verified-item" key={`${displayName(spot)}-${index}`}>
                  <strong>{displayName(spot)}</strong>
                  {spot.category && <small>{spot.category}</small>}
                  {spot.description && <p>{spot.description}</p>}
                  {spot.whyFamous && <p>পরিচিতি: {spot.whyFamous}</p>}
                  {spot.location && <p>অবস্থান: {spot.location}</p>}
                  {spot.howToReach && <p>যাতায়াত: {spot.howToReach}</p>}
                  {spot.mapQuery && <a className="text-link map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.mapQuery)}`} target="_blank" rel="noreferrer">মানচিত্রে দেখুন <ArrowRight size={15} /></a>}
                  {spot.sourceUrl && sourceTitles.has(spot.sourceUrl) && <p><a className="text-link" href={spot.sourceUrl} target="_blank" rel="noreferrer">তথ্যসূত্র: {sourceTitles.get(spot.sourceUrl)}</a></p>}
                </div>
              ))}
            </div>
            {district.mapQuery && <a className="text-link map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(district.mapQuery)}`} target="_blank" rel="noreferrer">জেলা মানচিত্রে দেখুন <ArrowRight size={15} /></a>}
          </article>
        )}
        {famousFoods.length > 0 && (
          <article className="info-panel">
            <span className="eyebrow">স্থানীয় স্বাদ</span><h2>বিখ্যাত খাবার</h2>
            <div className="verified-item-list">
              {famousFoods.map((food, index) => (
                <div className="verified-item" key={`${displayName(food)}-${index}`}>
                  <strong>{displayName(food)}</strong>
                  {food.classification && <small>{food.classification}</small>}
                  {food.description && <p>{food.description}</p>}
                  {food.sourceUrl && sourceTitles.has(food.sourceUrl) && <p><a className="text-link" href={food.sourceUrl} target="_blank" rel="noreferrer">তথ্যসূত্র: {sourceTitles.get(food.sourceUrl)}</a></p>}
                </div>
              ))}
            </div>
          </article>
        )}
        {transportDetails.length > 0 && (
          <article className="info-panel">
            <span className="eyebrow">যাতায়াত</span><h2>কীভাবে যাবেন ও ঘুরবেন</h2>
            <div className="verified-item-list">{transportDetails.map((detail, index) => <p key={`${detail}-${index}`}>{detail}</p>)}</div>
          </article>
        )}
        {budgetItems.length > 0 && (
          <article className="info-panel">
            <span className="eyebrow">আনুমানিক খরচ</span><h2>বাজেট</h2>
            <div className="verified-item-list">
              {budgetItems.map(([key, range]) => <p key={key}>{budgetLabels[key]}: {formatCurrency(range.min)}–{formatCurrency(range.max)}{range.asOf ? ` (${range.asOf})` : ''}</p>)}
            </div>
          </article>
        )}
        {district.popularActivities?.length > 0 && (
          <article className="info-panel">
            <span className="eyebrow">জেলার বিশেষত্ব</span><h2>জনপ্রিয় কার্যক্রম</h2>
            <div className="tag-list">{district.popularActivities.map((activity) => <span key={activity}>{activity}</span>)}</div>
          </article>
        )}
        {availablePlans.length > 0 && (
          <article className="info-panel plan-panel">
            <span className="eyebrow">আপনার ভ্রমণসূচি</span><h2>কীভাবে ঘুরবেন?</h2>
            <div className="plan-tabs" role="tablist" aria-label="ভ্রমণের দিনের পরিকল্পনা">
              {availablePlans.map(([key, plan]) => <button type="button" key={key} role="tab" aria-selected={selectedPlanKey === key} className={selectedPlanKey === key ? 'selected' : ''} onClick={() => setPlanDays(key)}>{plan.label}</button>)}
            </div>
            <ol className="plan-list">{plans[selectedPlanKey].items.map((item, index) => <li key={`${displayName(item)}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{displayName(item)}</li>)}</ol>
          </article>
        )}
        {sources.length > 0 && (
          <article className="info-panel">
            <span className="eyebrow">তথ্যসূত্র</span><h2>তথ্যের উৎস</h2>
            <ul className="source-list">{sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
          </article>
        )}
      </div>
      <Link className="button button-primary detail-cta" to="/travel-planner">এই জেলায় ভ্রমণ পরিকল্পনা করুন <ArrowRight size={17} /></Link>
    </section>
  )
}
