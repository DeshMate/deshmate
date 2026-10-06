import { formatCurrency } from './calculations.js'

const costLabels = [
  ['transport', 'যাতায়াত'],
  ['accommodation', 'হোটেল / থাকা'],
  ['food', 'খাবার'],
  ['localTransport', 'স্থানীয় যাতায়াত'],
  ['other', 'অন্যান্য প্রয়োজনীয় খরচ'],
]

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character])
}

function getDestinationPlaces(destination) {
  return (destination.touristSpots || [])
    .map((spot) => typeof spot === 'string' ? spot : spot.nameBn || spot.name)
    .filter(Boolean)
}

function getAverage(range) {
  return Math.round((range.min + range.max) / 2)
}

export function downloadTourImage(estimate, format) {
  const places = getDestinationPlaces(estimate.destination)
  const placeRows = places.slice(0, 4).map((place, index) => {
    const y = 538 + index * 48
    return `<circle cx="118" cy="${y - 7}" r="5" class="dot"/><text x="140" y="${y}" class="body">${escapeXml(place)}</text>`
  }).join('')
  const rows = costLabels.map(([key, label], index) => {
    const y = 802 + index * 50
    const range = `${formatCurrency(estimate.costs.breakdown[key].min)} – ${formatCurrency(estimate.costs.breakdown[key].max)}`
    return `<text x="100" y="${y}" class="body">${escapeXml(label)}</text><text x="860" y="${y}" text-anchor="end" class="amount">${escapeXml(range)}</text><line x1="100" y1="${y + 18}" x2="860" y2="${y + 18}" class="rule"/>`
  }).join('')
  const average = getAverage(estimate.costs.total)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1300" viewBox="0 0 1000 1300">
    <defs><linearGradient id="hero" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0f704d"/><stop offset="1" stop-color="#35a879"/></linearGradient><pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff" opacity=".2"/></pattern></defs>
    <style>.bg{fill:#eef4f1}.card{fill:#fff;stroke:#dce9e2;stroke-width:2}.brand{font:700 34px 'Noto Sans Bengali',Arial,sans-serif;fill:#143b2d}.sub{font:20px 'Noto Sans Bengali',Arial,sans-serif;fill:#657b70}.eyebrow{font:700 15px 'Noto Sans Bengali',Arial,sans-serif;fill:#badfc9;letter-spacing:1px}.heroTitle{font:700 36px 'Noto Sans Bengali',Arial,sans-serif;fill:#fff}.heroSub{font:20px 'Noto Sans Bengali',Arial,sans-serif;fill:#e1f4e9}.title{font:700 25px 'Noto Sans Bengali',Arial,sans-serif;fill:#183b2e}.body{font:19px 'Noto Sans Bengali',Arial,sans-serif;fill:#53685d}.amount{font:600 18px 'Noto Sans Bengali',Arial,sans-serif;fill:#183b2e}.rule{stroke:#e7eee9}.note{font:16px 'Noto Sans Bengali',Arial,sans-serif;fill:#718177}.dot{fill:#16845b}.totalLabel{font:18px 'Noto Sans Bengali',Arial,sans-serif;fill:#d8f1e2}.total{font:700 24px 'Noto Sans Bengali',Arial,sans-serif;fill:#fff}.footer{font:16px 'Noto Sans Bengali',Arial,sans-serif;fill:#718177}</style>
    <rect width="1000" height="1300" class="bg"/>
    <rect x="48" y="38" width="904" height="1224" rx="28" class="card"/>
    <text x="92" y="105" class="brand">DeshMate</text>
    <text x="92" y="140" class="sub">বাংলাদেশকে জানুন, জীবনের হিসাব করুন</text>
    <rect x="78" y="178" width="844" height="226" rx="24" fill="url(#hero)"/>
    <rect x="78" y="178" width="844" height="226" rx="24" fill="url(#dots)"/>
    <text x="112" y="222" class="eyebrow">TRAVEL PLAN</text>
    <text x="112" y="286" class="heroTitle">${escapeXml(estimate.origin.nameBangla)} → ${escapeXml(estimate.destination.nameBangla)}</text>
    <text x="112" y="333" class="heroSub">${escapeXml(estimate.costs.assumptions.travelers)} জন · ${escapeXml(estimate.costs.assumptions.days)} দিন · ${escapeXml(estimate.costs.assumptions.nights)} রাত</text>
    <text x="112" y="375" class="heroSub">${escapeXml(estimate.destination.nameEnglish)} · DeshMate মানচিত্র লিংক</text>
    <text x="100" y="463" class="title">ঘোরার স্থান</text>
    ${placeRows || '<text x="120" y="510" class="body">গন্তব্যটি ঘুরে দেখুন</text>'}
    ${places.length > 4 ? `<text x="140" y="748" class="note">আরও ${places.length - 4}টি স্থান DeshMate-এ দেখুন</text>` : ''}
    <text x="100" y="770" class="title">আনুমানিক খরচ</text>
    ${rows}
    <text x="100" y="1085" class="note">কার্যক্রম / প্রবেশ ফি: নির্দিষ্ট মূল্য মোট অনুমানে অন্তর্ভুক্ত নয়</text>
    <rect x="90" y="1110" width="820" height="94" rx="17" fill="#143b2d"/>
    <text x="120" y="1148" class="totalLabel">সর্বনিম্ন ${escapeXml(formatCurrency(estimate.costs.total.min))} · গড় ${escapeXml(formatCurrency(average))} · সর্বোচ্চ ${escapeXml(formatCurrency(estimate.costs.total.max))}</text>
    <text x="120" y="1185" class="total">জনপ্রতি ${escapeXml(formatCurrency(estimate.costs.perPerson.min))} – ${escapeXml(formatCurrency(estimate.costs.perPerson.max))}</text>
    <text x="500" y="1237" text-anchor="middle" class="footer">Created with DeshMate · ${escapeXml(window.location.host)}</text>
  </svg>`

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    const image = new window.Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 2000
        canvas.height = 2600
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
