import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import districts from '../src/data/districts.js'
import { toolCatalog } from '../src/data/tools.js'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
if (!process.env.SITE_URL) throw new Error('Set SITE_URL to the deployed site origin before generating SEO files.')
const configuredSiteUrl = new URL(process.env.SITE_URL)
if (!['http:', 'https:'].includes(configuredSiteUrl.protocol)) {
  throw new Error('SITE_URL must use HTTP or HTTPS.')
}
const siteUrl = configuredSiteUrl.origin
const routes = [
  '/',
  '/districts',
  ...districts.map(({ id }) => `/district/${id}`),
  '/travel-planner',
  '/tools',
  ...toolCatalog.map(({ id }) => `/tools/${id}`),
  '/about',
  '/contact',
  '/privacy',
  '/terms',
]
const lastModified = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${siteUrl}${route}</loc><lastmod>${lastModified}</lastmod></url>`).join('\n')}\n</urlset>\n`
const robots = `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`

await Promise.all([
  writeFile(resolve(projectRoot, 'public/sitemap.xml'), sitemap),
  writeFile(resolve(projectRoot, 'public/robots.txt'), robots),
])
