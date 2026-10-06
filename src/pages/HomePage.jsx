import { useMemo, useState } from 'react'
import { ArrowRight, Calculator, Compass, MapPin, Search, Sparkles, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import districts from '../data/districts.js'
import { toolCatalog } from '../data/tools.js'

const features = [
  { icon: MapPin, title: '৬৪ জেলা', text: 'প্রতিটি জেলার দর্শনীয় স্থান ও ভ্রমণ গাইড', to: '/districts', tag: 'এক্সপ্লোর করুন' },
  { icon: Compass, title: 'Travel Planner', text: 'দল ও দিনের হিসাবে ভ্রমণ বাজেট সাজান', to: '/travel-planner', tag: 'পরিকল্পনা করুন' },
  { icon: Wallet, title: 'জীবনের হিসাব', text: 'খরচ, সঞ্চয়, EMI ও ভবিষ্যৎ পরিকল্পনা', to: '/tools', tag: '১১টি ফ্রি টুল' },
]

function SectionHeading({ eyebrow, title, description, link, linkText = 'সব দেখুন' }) {
  return (
    <div className="section-heading">
      <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>
      {link && <Link className="text-link" to={link}>{linkText}<ArrowRight size={16} /></Link>}
    </div>
  )
}

export default function HomePage() {
  const [districtQuery, setDistrictQuery] = useState('')
  const [division, setDivision] = useState('সব বিভাগ')
  const divisions = useMemo(() => ['সব বিভাগ', ...new Set(districts.map((district) => district.divisionBangla))], [])
  const previewDistricts = useMemo(() => districts.filter((district) => {
    const matchesDivision = division === 'সব বিভাগ' || district.divisionBangla === division
    const query = districtQuery.trim().toLocaleLowerCase()
    const matchesQuery = !query || district.nameBangla.toLocaleLowerCase().includes(query) || district.nameEnglish.toLocaleLowerCase().includes(query)
    return matchesDivision && matchesQuery
  }).slice(0, 6), [division, districtQuery])

  return (
    <>
      <section className="hero-section">
        <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero-kicker"><Sparkles size={15} /> আপনার বাংলাদেশ, আপনার পরিকল্পনায়</span>
            <h1>বাংলাদেশকে জানুন,<br /><span>জীবনের হিসাব করুন</span></h1>
            <p>ভ্রমণ পরিকল্পনা করুন, ৬৪ জেলা ঘুরে দেখুন এবং জীবনের গুরুত্বপূর্ণ খরচের হিসাব করুন—সব এক জায়গায়।</p>
            <div className="hero-buttons">
              <Link className="button button-primary" to="/districts">জেলা ঘুরে দেখুন <ArrowRight size={17} /></Link>
              <Link className="button button-secondary" to="/travel-planner"><Compass size={17} /> Travel Planner</Link>
            </div>
            <div className="hero-proof"><div className="proof-avatars"><span>ঢা</span><span>চ</span><span>সি</span></div><span>সারা বাংলাদেশের জন্য তৈরি</span></div>
          </div>
          <div className="hero-visual" aria-label="বাংলাদেশ ভ্রমণ পরিকল্পনা">
            <div className="visual-map">
              <div className="map-grid" />
              <div className="map-water" />
              <span className="map-pin pin-dhaka"><MapPin size={22} fill="currentColor" /><b>ঢাকা</b></span>
              <span className="map-pin pin-cox"><MapPin size={22} fill="currentColor" /><b>কক্সবাজার</b></span>
              <span className="map-pin pin-sylhet"><MapPin size={22} fill="currentColor" /><b>সিলেট</b></span>
              <span className="map-route route-one" /><span className="map-route route-two" />
              <div className="map-label"><span className="map-label-icon"><Compass size={17} /></span><span><b>আপনার পরের গন্তব্য?</b><small>বাংলাদেশের ৬৪টি জেলা</small></span></div>
              <div className="map-stat"><strong>৬৪</strong><span>জেলা</span></div>
            </div>
          </div>
        </div>
        <div className="hero-bottom"><span>৮টি বিভাগ</span><i /><span>৬৪টি জেলা</span><i /><span>১১টি পরিকল্পনা টুল</span></div>
      </section>

      <section className="feature-strip content-container" aria-label="প্রধান সেবা">
        {features.map(({ icon: Icon, title, text, to, tag }) => (
          <Link className="feature-card" to={to} key={title}>
            <span className="feature-icon"><Icon size={21} /></span>
            <span className="feature-copy"><strong>{title}</strong><small>{text}</small></span>
            <span className="feature-tag">{tag}</span>
            <ArrowRight className="feature-arrow" size={17} />
          </Link>
        ))}
      </section>

      <section className="content-section content-container">
        <SectionHeading eyebrow="আপনার প্রয়োজনীয় টুলস" title="পরিকল্পনা হোক আরও সহজ" description="বাসা তৈরি থেকে মাসের বাজার—প্রয়োজনীয় হিসাব করুন কয়েক মুহূর্তেই।" link="/tools" linkText="সব লাইফ টুলস" />
        <div className="tool-card-grid">
          {toolCatalog.slice(0, 6).map((tool, index) => (
            <Link className="tool-card" to={`/tools/${tool.id}`} key={tool.id}>
              <span className={`tool-card-icon tone-${index % 4}`}><Calculator size={19} /></span>
              <span className="tool-card-title">{tool.nameBangla}</span>
              <span className="tool-card-description">{tool.summaryBangla}</span>
              <span className="tool-card-link">হিসাব শুরু করুন <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="district-preview-section">
        <div className="content-container">
          <SectionHeading eyebrow="বাংলাদেশ এক্সপ্লোরার" title="কোন জেলায় যাবেন?" description="আপনার পরের ভ্রমণের অনুপ্রেরণা খুঁজে নিন দেশের ৬৪ জেলা থেকে।" link="/districts" linkText="সব ৬৪ জেলা দেখুন" />
          <div className="district-controls">
            <label className="district-search"><Search size={17} /><input value={districtQuery} onChange={(event) => setDistrictQuery(event.target.value)} placeholder="জেলার নাম লিখুন..." aria-label="জেলা খুঁজুন" /></label>
            <label className="division-select"><span className="sr-only">বিভাগ বাছাই</span><select value={division} onChange={(event) => setDivision(event.target.value)}>{divisions.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <div className="district-card-grid">
            {previewDistricts.map((district) => (
              <Link className="district-card" to={`/districts/${district.id}`} key={district.id}>
                <span className="district-card-top"><MapPin size={16} /><span>{district.divisionBangla} বিভাগ</span></span>
                <strong>{district.nameBangla}</strong><small>{district.nameEnglish}</small>
                <span className="district-card-footer">{district.attractions.slice(0, 2).join(' · ')}<ArrowRight size={15} /></span>
              </Link>
            ))}
            {!previewDistricts.length && <div className="empty-state">এই নামে কোনো জেলা পাওয়া যায়নি। অন্যভাবে খুঁজে দেখুন।</div>}
          </div>
        </div>
      </section>

      <section className="travel-promo content-container">
        <div className="travel-promo-icon"><Compass size={24} /></div>
        <div><span className="eyebrow">ভ্রমণের বাজেট, আগে থেকেই</span><h2>ভ্রমণে খরচ কত হতে পারে?</h2><p>যাতায়াত, থাকা, খাবারসহ সব খরচ যোগ করে আপনার দলের জন্য একটি পরিষ্কার বাজেট পান।</p></div>
        <Link className="button button-primary" to="/travel-planner">Travel Planner খুলুন <ArrowRight size={17} /></Link>
      </section>
    </>
  )
}
