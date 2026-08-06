## Standalone

While the server automatically injects the reactivity engine into HTML responses, the reifier and router can also be manually imported into specific HTML files. This enables hosting static sites without a Deno server (such as on GitHub Pages or Cloudflare Pages) or integrating with a custom back end.

Additionally, the reactivity engine can be imported into existing projects without extra dependencies or setup, allowing you to progressively replace any front-end framework or simply use it as a global state management solution.

### Create Module

Create a `sedativ.js` file in your `src/` directory and paste the following code into it:

```js
// /sedativ.js
export let reifier = (value = undefined, tag = undefined, effects = new Set(), range = document.createRange()) => {
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
```

### Import Runtime in HTML

Import `sedativ.js` directly in the `<head>` of your HTML document before loading component scripts:

```js
<script type="module">
  import { reifier, router } from '/sedativ.js'
  globalThis.$ = reifier
  globalThis._ = router()
</script>
```

### Disable Auto-Injection

If you continue running `main.mjs` but prefer manual script importing, remove the inline runtime injection from `resolveRuntime`:

```js
// main.mjs
if (req.ext === 'html') return encoder.encode((await Deno.readTextFile(req.route)).replace('</title>', `</title>
  <script>globalThis.req = ${JSON.stringify({ params: req.params, query: req.query, locals: req.locals })}</script>
  <script>${config.isDev ? reloadClient : ''}</script>
`))
```

### Optional Bundling

Client components are served as native ES modules rather than bundled at build time. Modern browsers efficiently load ES module graphs over HTTP/2 and HTTP/3 while caching each module independently. As a result, updating a component typically requires downloading only that module instead of an entire bundle.

If for some reason you need to bundle part of your codebase, Deno provides a built-in bundler to produce a single self-contained file. Open your terminal and execute the command pointing to the file you want to bundle:

```
deno bundle --platform=browser --minify ./src/app.js > ./src/bundle.js
```

`deno bundle`: Produces a single bundle.js file containing all module dependencies, resulting in a self-contained application file.

`--platform=browser`: Sets the target execution environment to browser to ensure browser-compatible global resolution.

`--minify`: Compresses whitespace, renames symbols, and optimizes output code size.

`./src/app.js`: The entry point file that Deno reads to trace and resolve all dependencies.

`./src/bundle.js`: The destination path and filename where the compiled, single-file bundle will be written.

Once generated, update your related imports to point directly to `bundle.js`.