import { useState } from 'react'
import { Copy, Download } from 'lucide-react'

const SHARE_IMAGE_PATH = '/deshmate-share-card.png'
const SHARE_TITLE = 'DeshMate — বাংলাদেশকে জানুন, জীবনের হিসাব করুন'
const SHARE_TEXT = 'বাংলাদেশের ৬৪ জেলা ঘুরে দেখুন, ভ্রমণের পরিকল্পনা করুন এবং জীবনের প্রয়োজনীয় হিসাব করুন—সব এক জায়গায়।'

function FacebookMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.4 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6v2.1H6.6v3.2h2.9V21h3.9Z" /></svg>
}

function InstagramMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.7" cy="6.7" r="1.15" fill="currentColor" /></svg>
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Continue to the built-in clipboard fallback.
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

async function createShareImageFile() {
  const response = await fetch(SHARE_IMAGE_PATH)
  if (!response.ok) throw new Error('Could not load the DeshMate share image')
  const png = await response.blob()
  if (png.type !== 'image/png') throw new Error('The DeshMate share image is not a PNG')
  return new File([png], 'deshmate-share.png', { type: 'image/png' })
}

function downloadImage(file) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function SocialShareActions({ compact = false }) {
  const [notice, setNotice] = useState('')
  const siteUrl = `${window.location.origin}/`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`

  async function shareInstagram() {
    try {
      const image = await createShareImageFile()
      const shareData = { title: SHARE_TITLE, text: `${SHARE_TEXT}\n${siteUrl}`, files: [image] }
      let supportsImageShare = Boolean(navigator.share)
      if (supportsImageShare && navigator.canShare) {
        try {
          supportsImageShare = navigator.canShare({ files: [image] })
        } catch {
          supportsImageShare = false
        }
      }
      if (supportsImageShare) {
        try {
          await navigator.share(shareData)
          setNotice('DeshMate-এর ছবি ও লিংক শেয়ার করা হয়েছে।')
          return
        } catch (error) {
          if (error.name === 'AbortError') return
        }
      }

      downloadImage(image)
      await copyText(siteUrl)
      setNotice('ছবিটি ডাউনলোড হয়েছে এবং ওয়েবসাইটের লিংক কপি হয়েছে। Instagram-এ ছবিটি পোস্ট করে caption-এ লিংকটি paste করুন।')
    } catch {
      setNotice('Instagram-এর জন্য share image তৈরি করা যায়নি। আবার চেষ্টা করুন।')
    }
  }

  async function copySiteLink() {
    try {
      await copyText(siteUrl)
      setNotice('DeshMate ওয়েবসাইটের লিংক কপি হয়েছে।')
    } catch {
      setNotice('লিংক কপি করা যায়নি। ব্রাউজারের clipboard অনুমতি পরীক্ষা করুন।')
    }
  }

  async function downloadSiteImage() {
    try {
      downloadImage(await createShareImageFile())
      setNotice('নামসহ DeshMate share image ডাউনলোড হয়েছে।')
    } catch {
      setNotice('Share image ডাউনলোড করা যায়নি। আবার চেষ্টা করুন।')
    }
  }

  return (
    <div className={`site-share-actions${compact ? ' site-share-actions-compact' : ''}`}>
      <a className="share-action-button share-facebook" href={facebookUrl} target="_blank" rel="noreferrer">
        <FacebookMark /> Facebook
      </a>
      <button className="share-action-button share-instagram" type="button" onClick={shareInstagram}>
        <InstagramMark /> Instagram
      </button>
      {!compact && (
        <>
          <button className="share-action-button" type="button" onClick={copySiteLink}>
            <Copy size={15} /> লিংক কপি
          </button>
          <button className="share-action-button" type="button" onClick={downloadSiteImage}>
            <Download size={15} /> ছবিটি ডাউনলোড
          </button>
        </>
      )}
      {notice && <p className="site-share-notice" role="status">{notice}</p>}
    </div>
  )
}
