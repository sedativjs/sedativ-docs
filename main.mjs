const decoder = new TextDecoder(), encoder = new TextEncoder()
const [dbModule, middlewareModule, cacheModule] = await Promise.all([import('./db.mjs'), import('./middleware.mjs'), import('./cache.mjs')]
  .map(path => path.then(module => module.default).catch(error => (console.warn(`\x1b[33mWarning\x1b[0m:`, error.message || error), () => {}))))

const config = {
  isDev: Deno.env.get('DENO_ENV') !== 'production' && !Deno.env.has('DENO_DEPLOYMENT_ID'),
  maxRequestsPerSecond: 100000,
  maxCacheEntries: 1024,
  cacheDuration: 0,
  cacheMaxSize: 1024 * 1024
}
const securityHeaders = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'geolocation=(), camera=(), microphone=()'
}

const mimeText = {
  html: 'text/html', css: 'text/css', txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', svg: 'image/svg+xml',
  js: 'application/javascript', mjs: 'application/javascript', cjs: 'application/javascript', json: 'application/json', xml: 'application/xml'
}
const mimeBinary = {
  webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', avif: 'image/avif',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', weba: 'audio/webm',
  mp4: 'video/mp4', mpeg: 'video/mpeg', webm: 'video/webm', ogv: 'video/ogg', avi: 'video/x-msvideo',
  woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf', eot: 'application/vnd.ms-fontobject',
  pdf: 'application/pdf', zip: 'application/zip', rar: 'application/vnd.rar', tar: 'application/x-tar', gz: 'application/gzip'
}
const parsers = {
  json: request => request.json(),
  form: request => request.formData(),
  multipart: request => request.formData(),
  blob: request => request.arrayBuffer(),
  default: request => request.text()
}

const LRU = (map) => {
  if (!map.hasOwnProperty('get')) {
    map.get = (key) => map.has(key) ? (val => (
      map.delete(key), Map.prototype.set.call(map, key, val), val))(Map.prototype.get.call(map, key)) : undefined
    map.set = (key, val) => (
      map.delete(key), Map.prototype.set.call(map, key, val), map.size > config.maxCacheEntries && map.delete(map.keys().next().value), map)
  } 
  return map
}
const caches = {
  paths: LRU(new Map()),
  routes: LRU(new Map()),
  handlers: LRU(new Map()),
  files: LRU(new Map()),
  ips: LRU(new Map())
}

export const resolveRoute = async (pathname) => {
  if (!config.isDev && caches.paths.has(pathname)) return caches.paths.get(pathname)
  const segments = pathname === '/' ? [] : pathname.replace(/\/$/, '').split('/').filter(Boolean)
  for (let depth = segments.length; depth >= 0; depth--) {
    const base = './src' + (depth ? '/' + segments.slice(0, depth).join('/') : '')
    const candidates = depth ? [base, base + '.html'] : ['./src/index.html']
    for (const candidate of candidates) {
      let exists = caches.routes.get(candidate)
      if (exists === undefined) {
        try { exists = (await Deno.stat(candidate)).isFile } catch { exists = false }
        !config.isDev && caches.routes.set(candidate, exists)
      }
      if (exists) {
        const result = { route: candidate, params: segments.slice(depth) }
        return (!config.isDev && caches.paths.set(pathname, result), result)
      }
    }
  }
  const fallback = { route: null, params: [] }
  return (!config.isDev && caches.paths.set(pathname, fallback), fallback)
}

export const resolveRequest = async (request) => {
  const { method, headers, url } = request
  const { pathname, searchParams } = new URL(url)
  const { route, params } = await resolveRoute(pathname)

  const ext = route ? route.split('.').pop() || '' : ''
  const mime = mimeText[ext] || mimeBinary[ext] || 'application/octet-stream'
  const type = Object.keys(parsers).find(type => headers.get('content-type')?.includes(type)) || 'default'

  const query = Object.fromEntries(searchParams)
  const cookies = Object.fromEntries((headers.get('cookie') || '').split('; ').filter(Boolean).map(c => (c.includes('=') ? c : c + '=').replace('=', '\x00').split('\x00')))
  const body = request.body ? await parsers[type](request).catch(() => parsers.default(request)) : ''

  return { method, headers, url, pathname, ext, mime, type, route, params, query, cookies, body, locals: {} }
}

export const resolveRuntime = async (req, cache, stat) => {
  if (req.ext === 'mjs') {
    if (!config.isDev && caches.handlers.has(req.route)) return caches.handlers.get(req.route)
    const folderUrl = `file://${Deno.cwd().replace(/\\/g, '/')}/${req.route.replace('./', '')}`.replace(/\/[^/]+$/, '/')
    const scriptSrc = (await Deno.readTextFile(req.route))
      .replace(/(from\s+['"])(\.\.?\/[^'"]+)(['"])/g, (_, prefix, importPath, suffix) => prefix + new URL(importPath, folderUrl).href + suffix)
      .replace(/\$\s*\(/, 'export default (')
    const blobUrl = URL.createObjectURL(new Blob([scriptSrc], { type: 'application/javascript' }))
    try {
      const handler = (await import(blobUrl)).default
      return (!config.isDev && caches.handlers.set(req.route, handler), handler) }
    catch (err) { return null }
    finally { URL.revokeObjectURL(blobUrl) }
  }

  if (req.ext === 'html') return encoder.encode((await Deno.readTextFile(req.route)).replace('</title>', `</title>
    <script>globalThis.req = ${JSON.stringify({ params: req.params, query: req.query, locals: req.locals })}</script>
    <script type="module">export let reifier = ${reifierSrc}; globalThis.$ = reifier; export let router = (${routerSrc})(); globalThis._ = router</script>
    <script>${config.isDev ? reloadClient : ''}</script>
  `))

  return stat.size <= cache.maxSize ? await Deno.readFile(req.route) : (await Deno.open(req.route)).readable
}

export const resolveResource = async (req, cache) => {
  const now = Date.now()
  let resource = caches.files.get(req.route)
  if (resource?.content && resource?.expires > now) return resource

  const stat = await Deno.stat(req.route)
  const cacheControl = cache.duration > 0 ? `public, max-age=${Math.floor(cache.duration / 1000)}, must-revalidate` : 'no-store'
  const etag = `W/"${stat.mtime.getTime()}-${stat.size}${cache.duration > 0 ? `-${Math.floor(now / cache.duration)}` : ''}"`
  const expires = now + cache.duration
  const headers = { 'content-type': req.mime, 'cache-control': cacheControl, 'etag': etag, ...securityHeaders, ...(config.isDev ? { 'expires': '0' } : {}) }
  
  const content = await resolveRuntime(req, cache, stat)
  resource = { expires, headers, content }
  return ((!config.isDev && cache.duration > 0 && stat.size <= cache.maxSize) && caches.files.set(req.route, resource), resource)
}

export const resolveResponse = async (request) => {
  try {
    const now = Date.now()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1'
    let limit = caches.ips.get(ip)
    if (!limit || now - limit.start >= 1000) { caches.ips.set(ip, limit = { count: 0, start: now }) }
    if (++limit.count > config.maxRequestsPerSecond) return new Response('Too many requests', { status: 429, headers: securityHeaders })

    const req = await resolveRequest(request)
    if (!req.route) return new Response('Not Found', { status: 404, headers: securityHeaders })
    const db = dbModule ? await dbModule(req) : null
    if (db instanceof Response) return db
    const middleware = middlewareModule ? await middlewareModule(req) : null
    if (middleware instanceof Response) return middleware
    const cache = (cacheModule ? await cacheModule(req) : null) || { duration: config.cacheDuration, maxSize: config.cacheMaxSize }
    if (cache instanceof Response) return cache
    const resource = await resolveResource(req, cache)
    if (!resource) return new Response('Not Found', { status: 404, headers: securityHeaders })

    if (request.headers.get('if-none-match') === resource.headers['etag']) return new Response(null, { status: 304, headers: resource.headers })

    let res
    if (req.ext === 'mjs') {
      const handler = typeof resource.content === 'function' ? await resource.content(req) : resource.content
      if (!(handler instanceof Response)) return new Response('Forbidden', { status: 403, headers: securityHeaders })
      res = handler
      Object.entries(resource.headers).forEach(([key, val]) => key.toLowerCase() === 'set-cookie'
        ? handler.headers.append(key, val)
        : !handler.headers.has(key) && handler.headers.set(key, val))
    } else res = new Response(resource.content, { status: 200, headers: resource.headers })

    if (res.body && mimeText[req.ext] && request.headers.get('accept-encoding')?.includes('gzip')) {
      const gzipHeaders = new Headers(res.headers)
      gzipHeaders.delete('content-length')
      gzipHeaders.set('content-encoding', 'gzip')
      return new Response(res.body.pipeThrough(new CompressionStream('gzip')), { status: res.status, statusText: res.statusText, headers: gzipHeaders })
    }

    return res
  } catch (err) {
    return (console.error('Server Error:', err), new Response('Server Error', { status: 500, headers: securityHeaders }))
  }
}

export const resolveReload = (timer, clients = new Set()) => {
  console.log('Live-reload enabled ⚡');
  (async () => {
    for await (const _ of Deno.watchFs('./src')) {
      clearTimeout(timer)
      timer = setTimeout(() => clients.forEach(c => c.readyState === 1 && c.send('reload')), 100)
    }
  })()

  const reloadServer = request => {
    const { socket, response } = Deno.upgradeWebSocket(request)
    socket.onopen = () => clients.add(socket)
    socket.onclose = () => clients.delete(socket)
    return response
  }

  const reloadClient = `new WebSocket(location.protocol.replace('http','ws')+'//'+location.host+'/_reload')
    .onmessage = ({ data }) => data === 'reload' && location.reload()`

  return { reloadServer, reloadClient }
}

export let reifier = (value, tag, effects = new Set(), range = document.createRange()) => {
  let remove = () => (
    reifier && effects.clear(),
    reifier = null
  )
  const render = ref => (
    reifier = () => value(ref),
    (rm => typeof rm === 'function' ? remove = rm : rm?.then?.(r => typeof r === 'function' && (remove = r)))(value(ref)),
    reifier = null
  )
  const reload = async (ref, strs, vals) => {
    const runHook = async (hook) => Promise.all([hook?.()].flat().map(anim => anim?.finished ?? anim))
    await runHook(ref.exit)
    ref.replaceChildren(range.createContextualFragment(strs.map((str, i) => str + (vals[i] ?? '')).join('')))
    await runHook(ref.enter)
  }

  typeof value === 'function' && !tag
    ? (render(), remove())
    : (tag && !customElements.get(tag) && customElements.define(tag, class extends HTMLElement {
      connectedCallback() { render(this) }
      disconnectedCallback() { remove(this) }
      html(strs, ...vals) { reload(this, strs, vals) }
    }))

  typeof value !== 'function' && tag && (localStorage.getItem(tag)
    ? value = JSON.parse(localStorage.getItem(tag))
    : localStorage.setItem(tag, JSON.stringify(value)))

  return newValue => newValue === undefined
    ? (reifier && effects.add(reifier), value)
    : (value = newValue, tag && localStorage.setItem(tag, JSON.stringify(value)),
      queueMicrotask(() => effects.forEach(fn => fn())), value)
}

export const router = () => {
  const activeRoute = $('')
  const caches = { 
    routes: new Map(), 
    modules: new Map() 
  }

  const resolveModule = route => caches.modules.has(route)
    ? caches.modules.get(route)
    : caches.modules.set(route, fetch(route, { method: 'HEAD' }).then(res => res.ok && (res.headers.get('Content-Type') || '').includes('javascript'))
      .catch(() => (caches.modules.delete(route), false))
    ).get(route)

  const loadModule = route => caches.routes.has(route)
    ? caches.routes.get(route)
    : caches.routes.set(route, customElements.get(`${route.split('/').pop() || 'index'}-route`) || import(`${route}.js`)
      .catch(() => (caches.routes.delete(route), false))
    ).get(route)

  const resolveRoute = async (pathname) => {
    const segments = pathname.split('/').filter(Boolean)
    for (let depth = segments.length; depth >= 0; depth--) {
      const candidate = depth ? '/' + segments.slice(0, depth).join('/') : '/index'
      if (caches.routes.has(candidate) || await resolveModule(`${candidate}.js`)) 
        return { route: candidate, params: segments.slice(depth) }
    }
    return { route: '', params: [] }
  }

  const loadRoute = async (pathname) => {
    if (typeof pathname !== 'string') return
    const { route, params } = await resolveRoute(pathname)
    if (route) await loadModule(route)
    globalThis.req = { ...globalThis.req, params }
    const name = route.split('/').pop() || 'index'
    activeRoute(`<${name}-route></${name}-route>`)
    if (pathname !== location.pathname) history.pushState({}, '', pathname)
  }

  $(ref => {
    ref.html`${activeRoute()}`

    globalThis.onclick = event => {
      const href = event.target.closest('a')?.getAttribute('href')
      href && (event.preventDefault(), loadRoute(href))
    }
    globalThis.onmouseover = async event => {
      const href = event.target.closest('a')?.getAttribute('href')
      if (href) {
        const { route } = await resolveRoute(href)
        route && loadModule(route)
      }
    }
    globalThis.onload = globalThis.onpopstate = () => loadRoute(location.pathname)
  }, 'client-router')

  return loadRoute
}

const reifierSrc = reifier.toString()
const routerSrc = router.toString()

const { reloadServer, reloadClient } = config.isDev ? resolveReload() : {}
export default { 
  fetch: request => request.url.endsWith('/_reload') && reloadServer ? reloadServer(request) : resolveResponse(request) 
}