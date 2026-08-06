## Runtime

```js
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
```

`resolveRuntime`: Determines how a requested source file is read and executed based on its file extension. It evaluates three distinct file categories: `.mjs` endpoints, `.html` layouts, and static assets.

### MJS Compilation

```js
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
```

`if (req.ext === 'mjs')`: Intercepts JavaScript files meant to run on the server, modifying their source code in memory before execution.

`caches.handlers.has(req.route)`: In production mode, skips file reading entirely if this backend file has been compiled and saved into memory previously.

`folderUrl`: Computes an absolute file URL pointing directly to the folder containing the file. This acts as a reference point so any relative paths inside the file still work correctly during virtual execution.

`scriptSrc`: Pulls the raw source code string from disk into memory.

- **Module Path Resolution**: The first `replace()` statement converts relative import paths into absolute file URLs using the calculated base path. This prevents path resolution failures when the code executes from a temporary Blob URL.

- **Syntax Transformation**: The second `replace()` statement converts the custom shorthand notation into a valid ECMA-compliant export statements.

`blobUrl`: Wraps the modified source code string inside a temporary web address `blobUrl` that the engine can read like a normal physical file.

`handler`: Loads the temporary web address into the running application, executing the backend code and grabbing its default exported function to use as the request handler.

`URL.revokeObjectURL(blobUrl)`: Immediately cleans up and deletes the temporary web address from memory once the import completes to avoid memory leaks.

### HTML Hydration

```js
if (req.ext === 'html') return encoder.encode((await Deno.readTextFile(req.route)).replace('</title>', `</title>
  <script>globalThis.req = ${JSON.stringify({ params: req.params, query: req.query, locals: req.locals })}</script>
  <script type="module">export let reifier = ${reifierSrc}; globalThis.$ = reifier; export let router = (${routerSrc})(); globalThis._ = router</script>
  <script>${config.isDev ? reloadClient : ''}</script>
`))
```

`if (req.ext === 'html')`: Catches requests for HTML pages, reads the document text, and injects configuration scripts directly into the document.

`encoder.encode(...)`: Converts the completed HTML text string back into a raw binary data array (Uint8Array) so the network can transmit it.

`replace('</title>', ...)`: Uses the document's closing title tag as a safe marker to inject the application's base frontend scripts.

`globalThis.req = { ... }`: Takes the server-side parameters, search variables, and custom local data, turns them into a JSON string, and exposes them directly to the browser window. This makes backend context instantly readable by frontend elements without requiring an extra API call.

`globalThis.$ = reifier`: Injects the complete client-side reactivity engine `reifierSrc` making reactive state management available everywhere on the page.

`globalThis._ = router`: Injects the complete client-side single-page router `routerSrc` and runs it immediately to take over standard browser navigation and links.

`${config.isDev ? reloadClient : ''}`: Checks the server environment profile. If local development is active, injects a background WebSocket script that reloads the browser tab automatically when a project file changes.

### Static Asset Delivery

```js
return stat.size <= cache.maxSize ? await Deno.readFile(req.route) : (await Deno.open(req.route)).readable
```

`stat.size <= cache.maxSize`: Evaluates whether the requested static asset file size is equal to or smaller than the safety threshold.

`Deno.readFile(req.route)`: Used for smaller assets. Reads the entire file directly into RAM at once to fulfill the request as quickly as possible.

`Deno.open(req.route)`: Used for larger assets. Bypasses server memory completely by opening a raw read stream directly from the disk, safely passing large payloads like videos or zip archives out to the network in fragments.