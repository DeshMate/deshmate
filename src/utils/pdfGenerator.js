function safeFilename(value) {
  const normalized = String(value || 'DeshMate-document')
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${normalized || 'DeshMate-document'}.pdf`
}

export async function generatePdfFile(element, filename) {
  if (!element) throw new Error('PDF report content is unavailable.')

  const [canvasModule, pdfModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  const html2canvas = canvasModule.default
  const { jsPDF } = pdfModule
  if (typeof html2canvas !== 'function' || typeof jsPDF !== 'function') {
    throw new Error('PDF generator could not be loaded.')
  }

  const canvas = await html2canvas(element, {
    scale: Math.min(window.devicePixelRatio || 2, 2),
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (clonedDocument) => {
      const report = clonedDocument.querySelector('[data-pdf-report]')
      const portal = clonedDocument.querySelector('.pdf-report-portal')
      if (portal) portal.style.visibility = 'visible'
      if (report) report.style.visibility = 'visible'
    },
  })
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 12
  const footerSpace = 12
  const contentWidth = pageWidth - margin * 2
  const contentHeight = pageHeight - margin - footerSpace
  const canvasScale = canvas.width / element.clientWidth
  const millimetersPerPixel = contentWidth / canvas.width
  const pagePixelHeight = Math.max(1, Math.floor(contentHeight / millimetersPerPixel))
  const pageCount = Math.ceil(canvas.height / pagePixelHeight)

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const sourceY = pageIndex * pagePixelHeight
    const sliceHeight = Math.min(pagePixelHeight, canvas.height - sourceY)
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeight
    const context = pageCanvas.getContext('2d')
    if (!context) throw new Error('PDF page could not be rendered.')
    context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)

    if (pageIndex > 0) pdf.addPage()
    pdf.addImage(
      pageCanvas.toDataURL('image/jpeg', 0.96),
      'JPEG',
      margin,
      margin,
      contentWidth,
      sliceHeight * millimetersPerPixel,
      undefined,
      'FAST',
    )
    pageCanvas.width = 0
    pageCanvas.height = 0
    pdf.setFont('helvetica')
    pdf.setFontSize(8)
    pdf.setTextColor(98, 116, 135)
    pdf.text(`${pageIndex + 1} / ${pageCount}`, pageWidth - margin, pageHeight - 5, { align: 'right' })
  }

  const reportBounds = element.getBoundingClientRect()
  for (const anchor of element.querySelectorAll('a[href]')) {
    const bounds = anchor.getBoundingClientRect()
    const relativeTop = (bounds.top - reportBounds.top) * canvasScale
    const pageIndex = Math.floor(relativeTop / pagePixelHeight)
    if (pageIndex < 0 || pageIndex >= pageCount) continue
    const x = margin + (bounds.left - reportBounds.left) * canvasScale * millimetersPerPixel
    const y = margin + (relativeTop - pageIndex * pagePixelHeight) * millimetersPerPixel
    const width = Math.max(bounds.width * canvasScale * millimetersPerPixel, 2)
    const height = Math.max(bounds.height * canvasScale * millimetersPerPixel, 2)
    pdf.setPage(pageIndex + 1)
    pdf.link(x, y, width, height, { url: anchor.href })
  }

  const blob = pdf.output('blob')
  if (!(blob instanceof Blob) || blob.size === 0) throw new Error('PDF generation returned an empty file.')
  return new File([blob], safeFilename(filename), { type: 'application/pdf' })
}
