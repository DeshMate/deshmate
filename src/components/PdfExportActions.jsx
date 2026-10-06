import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Download, Mail, Printer, Share2 } from 'lucide-react'
import { generatePdfFile } from '../utils/pdfGenerator.js'

const BRAND_URL = 'https://deshmate.pages.dev/'

function downloadFile(file) {
  const objectUrl = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = file.name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // Use the browser fallback below when clipboard permission is unavailable.
    }
  }

  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.append(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  if (!copied) throw new Error('Clipboard access is unavailable.')
}

function ReportDocument({ title, sections, shareUrl, generatedAt }) {
  return (
    <article className="pdf-report" data-pdf-report>
      <header className="pdf-report-header">
        <div className="pdf-report-brand">DESHMATE</div>
        <div className="pdf-report-tagline">বাংলাদেশকে জানুন, জীবনের হিসাব করুন</div>
        <h1>{title}</h1>
        <p>তৈরির সময়: {generatedAt}</p>
      </header>
      {sections.filter((section) => section && (
        section.paragraph || section.rows?.length || section.items?.length || section.links?.length
      )).map((section, index) => (
        <section className="pdf-report-section" key={`${section.heading}-${index}`}>
          <h2>{section.heading}</h2>
          {section.paragraph && <p className="pdf-report-paragraph">{section.paragraph}</p>}
          {section.rows?.length > 0 && (
            <table className="pdf-report-table">
              <tbody>
                {section.rows.filter((row) => row?.value !== '' && row?.value !== null && row?.value !== undefined).map((row, rowIndex) => (
                  <tr key={`${row.label}-${rowIndex}`}><th>{row.label}</th><td>{String(row.value)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {section.items?.length > 0 && (
            <ul className="pdf-report-list">
              {section.items.filter(Boolean).map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}
            </ul>
          )}
          {section.links?.length > 0 && (
            <ul className="pdf-report-list pdf-report-links">
              {section.links.filter((link) => link?.url && link?.title).map((link) => (
                <li key={`${link.title}-${link.url}`}><a href={link.url}>{link.title}</a></li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {shareUrl && shareUrl !== BRAND_URL && (
        <section className="pdf-report-section">
          <h2>এই ফলাফলের লিংক</h2>
          <p className="pdf-report-url">{shareUrl}</p>
        </section>
      )}
      <footer className="pdf-report-footer">
        DeshMate · <a href={BRAND_URL}>{BRAND_URL}</a>
      </footer>
    </article>
  )
}

export default function PdfExportActions({
  title,
  filename,
  sections,
  shareUrl = window.location.href,
  shareSummary = '',
  compact = false,
}) {
  const reportRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [generatedAt, setGeneratedAt] = useState('')

  async function makePdf() {
    if (busy) return null
    setBusy(true)
    setNotice('')
    setGeneratedAt(new Date().toLocaleString('bn-BD'))
    try {
      await new Promise((resolve) => window.requestAnimationFrame(resolve))
      const file = await generatePdfFile(reportRef.current, filename)
      return file
    } catch (error) {
      setNotice('PDF তৈরি করা যায়নি। আবার চেষ্টা করুন অথবা Print → Save as PDF ব্যবহার করুন।')
      console.error('DeshMate PDF export failed:', error)
      return null
    } finally {
      setBusy(false)
    }
  }

  async function savePdf() {
    const file = await makePdf()
    if (!file) return
    downloadFile(file)
    setNotice(`${file.name} ডাউনলোড হয়েছে।`)
  }

  async function sharePdf() {
    const file = await makePdf()
    if (!file) return
    const shareData = {
      title: `DeshMate — ${title}`,
      text: `${shareSummary || title}\n${shareUrl}`,
      url: shareUrl,
      files: [file],
    }
    let supportsFileShare = typeof navigator.share === 'function'
    if (supportsFileShare && navigator.canShare) {
      try {
        supportsFileShare = navigator.canShare({ files: [file] })
      } catch {
        supportsFileShare = false
      }
    } else {
      supportsFileShare = false
    }

    if (supportsFileShare) {
      try {
        await navigator.share(shareData)
        setNotice('PDF share sheet-এ পাঠানো হয়েছে।')
        return
      } catch (error) {
        if (error.name === 'AbortError') return
      }
    }

    downloadFile(file)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareUrl,
        })
        setNotice('PDF ডাউনলোড হয়েছে এবং লিংক শেয়ার করা হয়েছে।')
        return
      } catch (error) {
        if (error.name === 'AbortError') return
      }
    }
    try {
      await copyText(shareUrl)
      setNotice('PDF ডাউনলোড হয়েছে এবং ফলাফলের লিংক কপি হয়েছে।')
    } catch {
      setNotice('PDF ডাউনলোড হয়েছে; লিংক কপি করা যায়নি।')
    }
  }

  async function emailPdf() {
    const file = await makePdf()
    if (!file) return
    downloadFile(file)
    const subject = encodeURIComponent(`DeshMate — ${title}`)
    const body = encodeURIComponent(`${shareSummary || title}\n\n${shareUrl}\n\nডাউনলোড করা PDF ফাইলটি ইমেইলে সংযুক্ত করুন।`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setNotice('PDF ডাউনলোড হয়েছে। ইমেইলে ফাইলটি নিজে সংযুক্ত করুন; সাইট সরাসরি attachment পাঠায় না।')
  }

  async function copyResultLink() {
    try {
      await copyText(shareUrl)
      setNotice('ফলাফলের লিংক কপি হয়েছে।')
    } catch {
      setNotice('লিংক কপি করা যায়নি। ব্রাউজারের clipboard অনুমতি পরীক্ষা করুন।')
    }
  }

  function printPdf() {
    setGeneratedAt(new Date().toLocaleString('bn-BD'))
    window.requestAnimationFrame(() => {
      document.body.classList.add('pdf-printing')
      const cleanup = () => document.body.classList.remove('pdf-printing')
      window.addEventListener('afterprint', cleanup, { once: true })
      window.setTimeout(cleanup, 60000)
      window.print()
    })
  }

  const portal = typeof document !== 'undefined' && document.body
    ? createPortal(<div className="pdf-report-portal"><div ref={reportRef}><ReportDocument title={title} sections={sections} shareUrl={shareUrl} generatedAt={generatedAt} /></div></div>, document.body)
    : null

  return (
    <>
      <div className={`pdf-export-actions${compact ? ' pdf-export-actions-compact' : ''}`}>
        <button className="pdf-export-button" type="button" onClick={savePdf} disabled={busy}><Download size={16} /> {busy ? 'PDF তৈরি হচ্ছে…' : 'PDF Save'}</button>
        <button className="pdf-export-button" type="button" onClick={sharePdf} disabled={busy}><Share2 size={16} /> Share PDF</button>
        <button className="pdf-export-button" type="button" onClick={emailPdf} disabled={busy}><Mail size={16} /> Email PDF</button>
        <button className="pdf-export-button" type="button" onClick={printPdf}><Printer size={16} /> Print</button>
        <button className="pdf-export-button" type="button" onClick={copyResultLink}><Copy size={16} /> লিংক কপি</button>
        {notice && <p className="pdf-export-notice" role="status">{notice}</p>}
      </div>
      {portal}
    </>
  )
}
