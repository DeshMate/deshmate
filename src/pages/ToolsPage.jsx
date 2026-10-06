import { lazy, Suspense, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Calculator, GraduationCap, Home, PiggyBank, Wallet } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toolCatalog } from '../data/tools.js'
import {
  calculateAbroadCost,
  calculateEducationCost,
  calculateElectricityUsage,
  calculateEMI,
  calculateHouseCost,
  calculateJapanCost,
  calculateKuwaitCost,
  calculateSalaryExpense,
  calculateTravelBudget,
  calculateWeddingBudget,
  formatCurrency,
} from '../utils/calculations.js'

const PdfExportActions = lazy(() => import('../components/PdfExportActions.jsx'))

const field = (key, label, placeholder = '0', extra = {}) => ({ key, label, placeholder, ...extra })
const fieldSets = {
  construction: [field('area', 'প্রতি তলার আয়তন (বর্গফুট)'), field('floors', 'তলার সংখ্যা', '1'), field('quality', 'নির্মাণের মান', '', { type: 'select', options: ['Basic', 'Standard', 'Premium'] })],
  wedding: [field('guests', 'অতিথির সংখ্যা'), field('foodPerPerson', 'জনপ্রতি খাবার খরচ (৳)'), field('venue', 'ভেন্যু ভাড়া (৳)'), field('decoration', 'সাজসজ্জা (৳)'), field('photography', 'ফটোগ্রাফি (৳)'), field('clothing', 'পোশাক (৳)'), field('transport', 'যাতায়াত (৳)'), field('other', 'অন্যান্য (৳)')],
  salary: [field('monthlyIncome', 'মাসিক আয় (৳)'), field('houseRent', 'বাড়ি ভাড়া (৳)'), field('food', 'খাবার (৳)'), field('transport', 'যাতায়াত (৳)'), field('utilities', 'বিদ্যুৎ, গ্যাস ও পানি (৳)'), field('family', 'পরিবার ও চিকিৎসা (৳)'), field('education', 'শিক্ষা (৳)'), field('loan', 'ঋণের কিস্তি (৳)'), field('other', 'অন্যান্য (৳)')],
  'car-emi': [field('vehiclePrice', 'গাড়ির দাম (৳)'), field('downPayment', 'ডাউন পেমেন্ট (৳)'), field('loanDurationMonths', 'ঋণের মেয়াদ (মাস)', '60'), field('interestRateAnnual', 'বার্ষিক সুদের হার (%)', '10')],
  'bike-emi': [field('vehiclePrice', 'বাইকের দাম (৳)'), field('downPayment', 'ডাউন পেমেন্ট (৳)'), field('loanDurationMonths', 'ঋণের মেয়াদ (মাস)', '36'), field('interestRateAnnual', 'বার্ষিক সুদের হার (%)', '10')],
  'travel-budget': [field('transport', 'যাতায়াত (৳)'), field('hotel', 'হোটেল (৳)'), field('food', 'খাবার (৳)'), field('activities', 'কার্যক্রম ও দর্শনীয় স্থান (৳)'), field('other', 'অন্যান্য (৳)')],
  'abroad-cost': [field('visa', 'ভিসা (৳)'), field('travel', 'বিমানভাড়া (৳)'), field('accommodation', 'থাকা (৳)'), field('documents', 'কাগজপত্র (৳)'), field('medical', 'মেডিকেল (৳)'), field('other', 'অন্যান্য (৳)')],
  'japan-cost': [field('languageCourse', 'ভাষা কোর্স (৳)'), field('visa', 'ভিসা (৳)'), field('flight', 'বিমানভাড়া (৳)'), field('medical', 'মেডিকেল (৳)'), field('documents', 'কাগজপত্র (৳)'), field('accommodation', 'থাকা (৳)'), field('food', 'খাবার (৳)'), field('transport', 'যাতায়াত (৳)'), field('other', 'অন্যান্য (৳)')],
  'kuwait-cost': [field('visa', 'ভিসা (৳)'), field('travel', 'বিমানভাড়া (৳)'), field('accommodation', 'থাকা (৳)'), field('documents', 'কাগজপত্র (৳)'), field('medical', 'মেডিকেল (৳)'), field('other', 'অন্যান্য (৳)')],
  electricity: [field('wattage', 'যন্ত্রের ক্ষমতা (ওয়াট)'), field('hours', 'প্রতিদিন ব্যবহারের সময় (ঘণ্টা)'), field('quantity', 'যন্ত্রের সংখ্যা', '1'), field('rate', 'প্রতি ইউনিটের দাম (৳)', '8')],
  education: [field('duration', 'মেয়াদ (মাস)'), field('tuition', 'টিউশন ফি (৳)'), field('books', 'বই ও উপকরণ (৳)'), field('transport', 'যাতায়াত (৳)'), field('accommodation', 'থাকা (৳)'), field('other', 'অন্যান্য (৳)')],
}

function getResult(id, values) {
  switch (id) {
    case 'construction':
      return { kind: 'range', data: calculateHouseCost(values) }
    case 'wedding':
      {
        const data = calculateWeddingBudget(values)
        return { kind: 'money', label: 'আনুমানিক মোট বাজেট', data, value: data.total }
      }
    case 'salary':
      return { kind: 'salary', data: calculateSalaryExpense(values) }
    case 'car-emi':
    case 'bike-emi':
      return { kind: 'money', label: 'আনুমানিক মাসিক কিস্তি', value: calculateEMI(values.vehiclePrice, values.downPayment, values.loanDurationMonths, values.interestRateAnnual) }
    case 'travel-budget':
      {
        const data = calculateTravelBudget(values)
        return { kind: 'money', label: 'আনুমানিক মোট বাজেট', data, value: data.grandTotal }
      }
    case 'abroad-cost':
      return { kind: 'money', label: 'আনুমানিক মোট খরচ', value: calculateAbroadCost(values).total }
    case 'japan-cost':
      return { kind: 'money', label: 'আনুমানিক মোট খরচ', value: calculateJapanCost(values).total }
    case 'kuwait-cost':
      return { kind: 'money', label: 'আনুমানিক মোট খরচ', value: calculateKuwaitCost(values).total }
    case 'electricity': {
      const usage = calculateElectricityUsage([{ wattage: values.wattage, hours: values.hours, quantity: values.quantity }])
      return { kind: 'electricity', daily: usage.dailyKWh, monthly: usage.monthlyKWh, bill: usage.monthlyKWh * (Number(values.rate) || 0) }
    }
    case 'education':
      return { kind: 'education', data: calculateEducationCost(values) }
    default:
      return null
  }
}

function ResultPanel({ result }) {
  if (!result) return null
  return (
    <aside className="calculator-result" aria-live="polite">
      <span className="eyebrow">আপনার হিসাব</span>
      {result.kind === 'range' && <div className="result-range">
        {[['সর্বনিম্ন', result.data.min], ['সম্ভাব্য', result.data.avg], ['সর্বোচ্চ', result.data.max]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{formatCurrency(value)}</strong></div>)}
      </div>}
      {result.kind === 'money' && <><p>{result.label}</p><strong className="result-amount">{formatCurrency(result.value)}</strong></>}
      {result.kind === 'salary' && <div className="result-stats">
        <div><small>মাসিক মোট খরচ</small><strong>{formatCurrency(result.data.totalExpense)}</strong></div>
        <div><small>হাতে থাকবে</small><strong className={result.data.remainingMoney < 0 ? 'negative' : ''}>{formatCurrency(result.data.remainingMoney)}</strong></div>
        <div><small>সঞ্চয়ের হার</small><strong>{result.data.savingsPercentage.toFixed(1)}%</strong></div>
      </div>}
      {result.kind === 'electricity' && <div className="result-stats">
        <div><small>দৈনিক ব্যবহার</small><strong>{result.daily.toFixed(2)} kWh</strong></div>
        <div><small>মাসিক ব্যবহার</small><strong>{result.monthly.toFixed(2)} kWh</strong></div>
        <div><small>আনুমানিক মাসিক বিল</small><strong>{formatCurrency(result.bill)}</strong></div>
      </div>}
      {result.kind === 'education' && <div className="result-stats">
        <div><small>মেয়াদ</small><strong>{result.data.duration} মাস</strong></div>
        <div><small>সমগ্র মেয়াদে মোট খরচ</small><strong>{formatCurrency(result.data.total)}</strong></div>
      </div>}
      <p className="result-note">{result.notice}</p>
    </aside>
  )
}

function CalculatorForm({ id }) {
  const fields = fieldSets[id]
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((item) => [item.key, item.key === 'quality' ? 'Standard' : item.placeholder || ''])))
  const [touchedFields, setTouchedFields] = useState({})
  const result = getResult(id, values)
  if (result) {
    result.notice = id === 'construction'
      ? 'এগুলো কেবল অনুমান। অবস্থান, উপকরণ, শ্রম ও নকশা অনুযায়ী প্রকৃত খরচ বদলাবে।'
      : ['abroad-cost', 'japan-cost', 'kuwait-cost'].includes(id)
        ? 'খরচগুলো অনুমানমাত্র। ভিসা ও অভিবাসন-সংক্রান্ত তথ্যের জন্য সরকারি সূত্র যাচাই করুন; এটি যোগ্যতা বা অনুমোদনের দাবি নয়।'
        : id === 'electricity'
          ? 'এটি আনুমানিক বিদ্যুৎ ব্যবহার ও বিল, বাংলাদেশে প্রযোজ্য কোনো সরকারি বিলের হিসাব নয়।'
          : 'এটি একটি আনুমানিক হিসাব। প্রকৃত খরচ আপনার পছন্দ ও বর্তমান দামের ওপর নির্ভর করবে।'
  }

  function updateValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }))
    setTouchedFields((current) => ({ ...current, [key]: true }))
  }

  const hasMeaningfulInput = id === 'electricity'
    ? ['wattage', 'hours'].every((key) => touchedFields[key] && Number(values[key]) > 0)
    : fields.some((item) =>
      item.type !== 'select'
      && touchedFields[item.key]
      && values[item.key] !== ''
      && Number.isFinite(Number(values[item.key]))
      && Number(values[item.key]) !== 0,
    )
  const hasMeaningfulResult = result?.kind === 'range'
    ? [result.data.min, result.data.avg, result.data.max].some((value) => value > 0)
    : result?.kind === 'money'
      ? result.value > 0
      : result?.kind === 'salary'
        ? result.data.totalExpense > 0 || result.data.remainingMoney !== 0
        : result?.kind === 'electricity'
          ? result.daily > 0 && result.monthly > 0
          : result?.kind === 'education'
            ? result.data.total > 0
            : false
  const tool = toolCatalog.find((item) => item.id === id)
  const inputRows = fields
    .filter((item) => item.type === 'select' || touchedFields[item.key])
    .map((item) => ({
      label: item.label,
      value: item.type === 'select'
        ? (item.key === 'quality'
          ? { Basic: 'সাশ্রয়ী', Standard: 'সাধারণ', Premium: 'প্রিমিয়াম' }[values[item.key]] || values[item.key]
          : values[item.key])
        : values[item.key] === '' ? null : `${values[item.key]}${item.key === 'area' ? ' sq ft' : item.key === 'floors' ? ' তলা' : item.key === 'duration' || item.key === 'loanDurationMonths' ? ' মাস' : item.key === 'interestRateAnnual' ? '%' : item.key === 'wattage' ? ' W' : item.key === 'hours' ? ' ঘণ্টা' : item.key === 'quantity' ? ' টি' : item.key === 'rate' ? ' ৳ / ইউনিট' : ' ৳'}`,
    }))
    .filter((row) => row.value !== null && row.value !== '')
  const resultRows = []
  if (result?.kind === 'range') {
    resultRows.push(
      { label: 'সর্বনিম্ন', value: formatCurrency(result.data.min) },
      { label: 'সম্ভাব্য', value: formatCurrency(result.data.avg) },
      { label: 'সর্বোচ্চ', value: formatCurrency(result.data.max) },
    )
  } else if (result?.kind === 'money') {
    resultRows.push({ label: result.label, value: formatCurrency(result.value) })
    if (result.data && id === 'wedding') {
      const labels = { food: 'খাবার', venue: 'ভেন্যু ভাড়া', decoration: 'সাজসজ্জা', photography: 'ফটোগ্রাফি', clothing: 'পোশাক', transport: 'যাতায়াত', other: 'অন্যান্য' }
      for (const [key, label] of Object.entries(labels)) resultRows.push({ label, value: formatCurrency(result.data[key]) })
    }
    if (result.data && id === 'travel-budget') {
      const labels = { transport: 'যাতায়াত', hotel: 'হোটেল', food: 'খাবার', activities: 'কার্যক্রম', other: 'অন্যান্য' }
      for (const [key, label] of Object.entries(labels)) resultRows.push({ label, value: formatCurrency(result.data[key]) })
    }
  } else if (result?.kind === 'salary') {
    resultRows.push(
      { label: 'মাসিক মোট খরচ', value: formatCurrency(result.data.totalExpense) },
      { label: 'হাতে থাকবে', value: formatCurrency(result.data.remainingMoney) },
      { label: 'সঞ্চয়ের হার', value: `${result.data.savingsPercentage.toFixed(1)}%` },
    )
  } else if (result?.kind === 'electricity') {
    resultRows.push(
      { label: 'দৈনিক ব্যবহার', value: `${result.daily.toFixed(2)} kWh` },
      { label: 'মাসিক ব্যবহার', value: `${result.monthly.toFixed(2)} kWh` },
      { label: 'আনুমানিক মাসিক বিল', value: formatCurrency(result.bill) },
    )
  } else if (result?.kind === 'education') {
    resultRows.push(
      { label: 'মেয়াদ', value: `${result.data.duration} মাস` },
      { label: 'সমগ্র মেয়াদে মোট খরচ', value: formatCurrency(result.data.total) },
    )
  }
  const pdfSections = [
    { heading: 'আপনার দেওয়া তথ্য', rows: inputRows },
    { heading: 'হিসাবের ফলাফল', rows: resultRows },
    { heading: 'গুরুত্বপূর্ণ নোট', paragraph: result?.notice },
  ]

  return (
    <div className="calculator-layout">
      <div className="calculator-form-panel">
        <div className="form-panel-heading"><span className="calculator-icon"><Calculator size={20} /></span><div><h2>আপনার তথ্য দিন</h2><p>পরিবর্তনের সঙ্গে সঙ্গেই হিসাব আপডেট হবে।</p></div></div>
        <div className="calculator-fields">
          {fields.map((item) => <label className="form-field" key={item.key}>
            <span>{item.label}</span>
            {item.type === 'select' ? <select value={values[item.key]} onChange={(event) => updateValue(item.key, event.target.value)}>{item.options.map((option) => <option key={option} value={option}>{option === 'Basic' ? 'সাশ্রয়ী' : option === 'Standard' ? 'সাধারণ' : 'প্রিমিয়াম'}</option>)}</select> :
              <div className="input-with-unit"><input type="number" min="0" step="any" inputMode="decimal" value={values[item.key]} placeholder={item.placeholder} onChange={(event) => updateValue(item.key, event.target.value)} /><span>{item.key === 'area' ? 'sq ft' : item.key === 'floors' ? 'তলা' : item.key === 'duration' || item.key === 'loanDurationMonths' ? 'মাস' : item.key === 'interestRateAnnual' ? '%' : item.key === 'wattage' ? 'W' : item.key === 'hours' ? 'ঘণ্টা' : item.key === 'quantity' ? 'টি' : item.key === 'rate' ? '৳ / ইউনিট' : '৳'}</span></div>}
          </label>)}
        </div>
      </div>
      <div className="calculator-output">
        <ResultPanel result={result} />
        {hasMeaningfulInput && hasMeaningfulResult && result && <Suspense fallback={null}><PdfExportActions
          title={tool.nameBangla}
          filename={`DeshMate-${tool.name.replace(/[^\w.-]+/g, '-')}`}
          sections={pdfSections}
          shareUrl={`https://deshmate.pages.dev/tools/${tool.id}`}
          shareSummary={`DeshMate · ${tool.nameBangla}: ${resultRows.map((row) => `${row.label} ${row.value}`).join(' · ')}`}
          compact
        /></Suspense>}
      </div>
    </div>
  )
}

export default function ToolsPage() {
  const icons = [Home, Wallet, PiggyBank, Calculator, Calculator, Calculator, Wallet, GraduationCap, Wallet, Calculator, GraduationCap]
  return (
    <section className="page-shell">
      <div className="page-heading">
        <span className="eyebrow">আপনার দৈনন্দিন সহকারী</span>
        <h1>লাইফ প্ল্যানিং <span>টুলস</span></h1>
        <p>নিজের তথ্য দিয়ে তাৎক্ষণিক হিসাব করুন। সব ক্যালকুলেশন আপনার ব্রাউজারেই হয়।</p>
      </div>
      <div className="tools-page-grid">
        {toolCatalog.map((tool, index) => {
          const Icon = icons[index]
          return <Link className="tool-card" to={`/tools/${tool.id}`} key={tool.id}>
            <span className={`tool-card-icon tone-${index % 4}`}><Icon size={19} /></span>
            <span className="tool-card-title">{tool.nameBangla}</span>
            <span className="tool-card-description">{tool.summaryBangla}</span>
            <span className="tool-card-link">হিসাব শুরু করুন <ArrowRight size={14} /></span>
          </Link>
        })}
      </div>
    </section>
  )
}

export function ToolDetailPage() {
  const { id } = useParams()
  const tool = useMemo(() => toolCatalog.find((item) => item.id === id), [id])
  if (!tool || !fieldSets[id]) return <section className="page-shell"><div className="empty-state">এই ক্যালকুলেটরটি পাওয়া যায়নি। <Link to="/tools">সব টুল দেখুন</Link></div></section>
  return (
    <section className="page-shell tool-detail-page">
      <Link className="back-link" to="/tools"><ArrowLeft size={16} /> সব লাইফ টুলস</Link>
      <div className="page-heading tool-detail-heading">
        <span className="eyebrow">DeshMate ক্যালকুলেটর</span>
        <h1>{tool.nameBangla}</h1>
        <p>{tool.summaryBangla}</p>
      </div>
      <CalculatorForm key={id} id={id} />
    </section>
  )
}
