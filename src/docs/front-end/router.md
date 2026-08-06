### Router

```js
export const router = () => {
  const activeRoute = $('')
  const caches = { 
    routes: new Map(), 
    modules: new Map() 
  }

  const resolveModule = route => caches.modules.has(route)
    ? caches.modules.get(route)
    : caches.modules.set(route, fetch(route, { method: 'HEAD' }).then(res => res.ok && (res.headers.get('content-type') || '').includes('javascript'))
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
```

Sedativ's client router intercepts page navigation, verifies file availability over the network, and updates the view using native Custom Elements.

- `Hybrid Architecture`: Lets server-rendered multi-page apps (MPA) and client-driven single-page apps (SPA) coexist in the same codebase without global setup.

- `Isolated Updates`: Page changes only re-render what is inside the `<client-router>` tag. Surrounding DOM nodes, playing media, inputs, and state remain untouched.

- `On-Demand Loading`: Modules are queried and fetched only when entering client-routed zones, keeping initial Time to Interactive (TTI) low.

### Resolve Module

```js
const resolveModule = route => caches.modules.has(route)
  ? caches.modules.get(route)
  : caches.modules.set(route, fetch(route, { method: 'HEAD' }).then(res => res.ok && (res.headers.get('content-type') || '').includes('javascript'))
    .catch(() => (caches.modules.delete(route), false))
  ).get(route)
```

`resolveModule()`: Serves as a network-level validation layer, verifying that a JavaScript file physically exists on the server and is safe to execute before the browser triggers a dynamic import.

`caches.modules.has(route)`: Checks the cache Map to reuse existing promises and avoid sending duplicate HTTP HEAD queries for the same path.

`fetch(route, { method: 'HEAD' })`: Sends a lightweight HEAD request to verify file existence and MIME headers on the server without downloading script payloads.

`res.ok && ...includes('javascript')`: Confirms the server returns a `200 OK` response and a valid JavaScript content type header.

`catch(() => (caches.modules.delete(route), false))`: Purges the failed entry from `caches.modules` on network drops or missing files and returns `false` to keep execution safe.

`.get(route)`: Retrieves the stored Promise directly from `caches.modules` after setting it.

### Load Module

```js
const loadModule = route => caches.routes.has(route)
  ? caches.routes.get(route)
  : caches.routes.set(route, customElements.get(`${route.split('/').pop() || 'index'}-route`) || import(`${route}.js`)
    .catch(() => (caches.routes.delete(route), false))
  ).get(route)
```

`loadModule()`: Downloads and runs the JavaScript component in the background once the route is verified.

`caches.routes.has(route)`: Checks the cache Map to reuse existing promises and avoid duplicate component imports for the same path.

`customElements.get(...) || import(...)`: Checks whether the browser has already registered the target custom element constructor before executing a dynamic import.

`catch(() => (caches.routes.delete(route), false))`: Purges the failed entry from `caches.routes` if module loading fails and returns `false` to keep execution safe.

`.get(route)`: Retrieves the stored Promise directly from `caches.routes` after setting it.

### Resolve Route

```js
const resolveRoute = async (pathname) => {
  const segments = pathname.split('/').filter(Boolean)
  for (let depth = segments.length; depth >= 0; depth--) {
    const candidate = depth ? '/' + segments.slice(0, depth).join('/') : '/index'
    if (caches.routes.has(candidate) || await resolveModule(`${candidate}.js`)) 
      return { route: candidate, params: segments.slice(depth) }
  }
  return { route: '', params: [] }
}
```

`resolveRoute()`: Implements the backtracking resolution algorithm, mirroring the file-system matching logic of the server router.

`pathname.split('/').filter(Boolean)`: Splits the URL string by slashes and removes empty items, creating a clean array of path segments.

`for (let depth = segments.length; depth >= 0; depth--)`: Loops backward from the deepest sub-path toward `/index` to match files on the server.

`segments.slice(0, depth).join('/')`: Reconstructs valid route string candidates at each directory depth.

`caches.routes.has(candidate) || await resolveModule(${candidate}.js)`: Checks local memory cache first before executing a network `HEAD` preflight query.

`return { route: candidate, params: segments.slice(depth) }`: Stops searching on the first matching file and returns the route path alongside any remaining path segments as dynamic URL parameters.

`return { route: '', params: [] }`: Returns an empty route object if no matching route file exists at any depth level.

### Load Route

```js
const loadRoute = async (pathname) => {
  const { route, params } = await resolveRoute(pathname)
  if (route) await loadModule(route)
  globalThis.req = { ...globalThis.req, params }
  const name = route.split('/').pop() || 'index'
  activeRoute(`<${name}-route></${name}-route>`)
  if (pathname !== location.pathname) history.pushState({}, '', pathname)
}
```

`loadRoute()`: Orchestrates the lifecycle execution pipeline, synchronizing path resolution, module loading, global state updates, and DOM re-rendering.

`await resolveRoute(pathname)`: Resolves the target pathname into a matching route path and its dynamic URL parameters.

`await loadModule(route)`: Downloads and registers the JavaScript module for the matched route if one exists.

`globalThis.req = { ...globalThis.req, params }`: Updates the global request object with the newly extracted URL parameters so components can access them.

`const name = route.split('/').pop() || 'index'`: Takes the last segment of the route path to construct the custom element tag name, defaulting to `'index'`.

`activeRoute(<${name}-route></${name}-route>)`: Injects the custom element tag into the reactive signal, triggering a DOM update inside the router boundary.

`history.pushState({}, '', pathname)`: Updates the browser address bar with the new path without forcing a full page refresh.

### Client Router Component

```js
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
```

`activeRoute()`: Binds the `activeRoute` signal directly to the container template so view changes render strictly inside.

`target.closest('a')?.getAttribute('href')`: Safely finds the nearest parent link element and reads its `href` attribute value.

`globalThis.onclick`: Listens for clicks anywhere on the page, checking if the clicked element is inside a link before taking over navigation with `loadRoute()`.

`globalThis.onmouseover`: Prefetches route module on link hover so component file is ready in memory before the user actually clicks.

`globalThis.onload = globalThis.onpopstate`: Automatically triggers route loading on initial page display and handles browser Back / Forward navigation.