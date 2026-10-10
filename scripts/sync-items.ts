// Snapshots item names, sizes and auction prices from deltaforceapi.com into
// src/data/itemRepository/catalog.json, so the game never calls the API at runtime.
//
//   DFAPI_KEY=... pnpm sync-items      (or put DFAPI_KEY in .env)

import { readFileSync, writeFileSync } from 'node:fs'

const API = 'https://api.deltaforceapi.com/deltaforceapi.gateway.ApiService/'
const OUT = new URL('../src/data/itemRepository/catalog.json', import.meta.url)
const CONCURRENCY = 6

interface ApiItem {
  id: string
  name: string
  type?: string
  typeSub?: string
  quality: number
  width: number
  height: number
  auctionable?: boolean
  iconUrl?: string
}

interface ApiPrice {
  price?: { price?: number; referencePrice?: number }
}

// Items bigger than the largest container (7x4) could never be placed.
const MAX_W = 7
const MAX_H = 4

function loadKey(): string | undefined {
  if (process.env.DFAPI_KEY) return process.env.DFAPI_KEY
  try {
    const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
    return env.match(/^DFAPI_KEY=(.+)$/m)?.[1].trim()
  } catch {}
}

const KEY = loadKey()
if (!KEY) {
  console.error('Missing DFAPI_KEY (set it in the environment or in .env)')
  process.exit(1)
}

async function call<T>(method: string, body: object, tries = 4): Promise<T> {
  const res = await fetch(API + method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Connect-Protocol-Version': '1', 'deltaforceapi-gateway-key': KEY },
    body: JSON.stringify(body),
  })
  if (res.ok) return res.json() as Promise<T>
  if (tries > 1 && (res.status === 429 || res.status >= 500)) {
    await new Promise((r) => setTimeout(r, 1000 * 2 ** (4 - tries)))
    return call<T>(method, body, tries - 1)
  }
  const err = (await res.json().catch(() => ({}))) as { message?: string }
  throw new Error(`${method} ${res.status}: ${err.message ?? res.statusText}`)
}

async function listItems(): Promise<ApiItem[]> {
  const items: ApiItem[] = []
  let pageToken: string | null | undefined
  do {
    const page = await call<{ items?: ApiItem[]; nextPageToken?: string }>('ListItems', { pageSize: 1000, ...(pageToken && { pageToken }) })
    items.push(...(page.items ?? []))
    pageToken = page.items?.length ? page.nextPageToken : null
  } while (pageToken)
  return items
}

// Runs fn over items with a small worker pool, keeping the API load gentle.
async function mapPool<T extends { name: string }, R>(items: T[], fn: (item: T) => Promise<R>): Promise<(R | null)[]> {
  const out = new Array<R | null>(items.length)
  let next = 0
  let done = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i]).catch((e: Error) => (console.warn(`\n${items[i].name}: ${e.message}`), null))
        process.stdout.write(`\rprices ${++done}/${items.length}`)
      }
    }),
  )
  process.stdout.write('\n')
  return out
}

const strip = (s: string | undefined, prefix: string) => s?.replace(prefix, '')

const all = await listItems()
console.log(`items ${all.length}`)

// The API's width/height are rows/columns; every icon is drawn the other way round.
const candidates = all
  .map((it) => ({ ...it, w: it.height, h: it.width }))
  .filter((it) => it.auctionable && it.iconUrl && it.w > 0 && it.h > 0 && it.w <= MAX_W && it.h <= MAX_H)

const prices = await mapPool(candidates, (it) => call<ApiPrice>('GetItemAuctionPrice', { itemId: it.id }))

const catalog = candidates
  .map((it, i) => ({
    id: it.id,
    name: it.name,
    type: strip(it.type, 'ITEM_TYPE_'),
    sub: strip(it.typeSub, 'ITEM_TYPE_SUB_'),
    quality: it.quality,
    w: it.w,
    h: it.h,
    price: prices[i]?.price?.price || prices[i]?.price?.referencePrice || 0,
  }))
  .filter((it) => it.price > 0)
  .sort((a, b) => a.name.localeCompare(b.name))

writeFileSync(OUT, JSON.stringify({ syncedAt: new Date().toISOString(), items: catalog }, null, 0).replace(/\},\{/g, '},\n{') + '\n')
console.log(`wrote ${catalog.length} priced items to src/data/itemRepository/catalog.json`)
