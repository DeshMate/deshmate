import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Search } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import districts from '../data/districts.js'
import { formatCurrency } from '../utils/calculations.js'

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
    return <section className="page-shell"><div className="empty-state">এই জেলার তথ্য পাওয়া যায়নি। <Link to="/districts">সব জেলা দেখুন</Link></div></section>
  }

  const plans = {
    one: { label: '১ দিন', items: district.suggestedOneDayPlan },
    two: { label: '২ দিন', items: district.suggestedTwoDayPlan },
    three: { label: '৩ দিন', items: district.suggestedThreeDayPlan },
  }

  return (
    <section className="page-shell district-detail-page">
      <Link className="back-link" to="/districts"><ArrowLeft size={16} /> সব জেলা</Link>
      <div className="detail-hero">
        <div className="detail-hero-copy">
          <span className="eyebrow">{district.divisionBangla} বিভাগ</span>
          <h1>{district.nameBangla} <span>{district.nameEnglish}</span></h1>
          <p>{district.shortDescription}</p>
          <span className="district-best-time"><CalendarDays size={16} /> ঘোরার ভালো সময়: {district.bestTimeToVisit}</span>
        </div>
        <div className="detail-budget-card">
          <span>প্রতিদিনের আনুমানিক বাজেট</span>
          <div><small>কম</small><strong>{formatCurrency(district.estimatedBudget.low)}</strong></div>
          <div><small>মাঝারি</small><strong>{formatCurrency(district.estimatedBudget.medium)}</strong></div>
          <div><small>স্বচ্ছন্দ</small><strong>{formatCurrency(district.estimatedBudget.high)}</strong></div>
          <small>প্রতি ব্যক্তির আনুমানিক খরচ</small>
        </div>
      </div>

      <div className="detail-content-grid">
        <article className="info-panel"><span className="eyebrow">জেলার পরিচয়</span><h2>ইতিহাস ও ঐতিহ্য</h2><p>{district.history}</p></article>
        <article className="info-panel"><span className="eyebrow">ঘুরে দেখুন</span><h2>দর্শনীয় স্থান</h2><div className="tag-list">{district.attractions.map((attraction) => <span key={attraction}>{attraction}</span>)}</div><a className="text-link map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(district.mapQuery || `${district.nameEnglish} Bangladesh`)}`} target="_blank" rel="noreferrer">Google Maps-এ দেখুন <ArrowRight size={15} /></a></article>
        <article className="info-panel"><span className="eyebrow">স্থানীয় স্বাদ</span><h2>বিখ্যাত খাবার</h2><div className="tag-list">{district.famousFoods.map((food) => <span key={food}>{food}</span>)}</div></article>
        <article className="info-panel"><span className="eyebrow">যাতায়াত</span><h2>কীভাবে ঘুরবেন</h2><p>{district.transportation}</p></article>
        <article className="info-panel plan-panel">
          <span className="eyebrow">আপনার ভ্রমণসূচি</span><h2>কীভাবে ঘুরবেন?</h2>
          <div className="plan-tabs" role="tablist" aria-label="ভ্রমণের দিনের পরিকল্পনা">
            {Object.entries(plans).map(([key, plan]) => <button type="button" key={key} role="tab" aria-selected={planDays === key} className={planDays === key ? 'selected' : ''} onClick={() => setPlanDays(key)}>{plan.label}</button>)}
          </div>
          <ol className="plan-list">{plans[planDays].items.map((item, index) => <li key={`${item}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ol>
        </article>
        <article className="info-panel"><span className="eyebrow">জেলার বিশেষত্ব</span><h2>কীসের জন্য পরিচিত</h2><div className="tag-list">{district.famousFor.map((item) => <span key={item}>{item}</span>)}</div></article>
      </div>
      <Link className="button button-primary detail-cta" to="/travel-planner">এই জেলায় ভ্রমণ পরিকল্পনা করুন <ArrowRight size={17} /></Link>
    </section>
  )
}
