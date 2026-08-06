## Route

```js
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
```

`resolveRoute`: Processes incoming URL pathnames by decomposing the path string into individual segments and executing a reverse-directory traversal. This approach avoids heavy regular expression evaluations by checking file existence from the most specific potential path backward to the `./src` root.

### Fast-Path Cache and URL Normalization

```js
if (!config.isDev && caches.paths.has(pathname)) return caches.paths.get(pathname)
const segments = pathname === '/' ? [] : pathname.replace(/\/$/, '').split('/').filter(Boolean)
```

`caches.paths.has(pathname)`: In production mode, the router looks up the raw pathname string in the path cache before performing any string manipulation or file checks. If a match is found, the pre-resolved route and parameter configuration object are returned instantly.

`pathname.replace(/\/$/, '')`: Standardizes incoming URLs by stripping out trailing slashes to prevent duplicate path keys.

`split('/').filter(Boolean)`: Breaks the URL into a clean array of text segments, discarding empty values caused by multiple consecutive slashes.

- If the path is **/users/123/posts/**, segments becomes `['users', '123', 'posts']`.

- If the path is just the root **/**, it resolves to an empty array `[]`.

### Directory Traversal and Candidate Construction

```js
for (let depth = segments.length; depth >= 0; depth--) {
  const base = './src' + (depth ? '/' + segments.slice(0, depth).join('/') : '')
  const candidates = depth ? [base, base + '.html'] : ['./src/index.html']
```

`for (let depth = segments.length; ...)`: A descending loop that reads the path segments backward. This guarantees that deeply nested files take execution priority over top-level parent routes.

`base`: Reconstructs the directory path at the current loop depth, forcing all checks to remain scoped strictly inside the `./src` folder. For a URL path of `/user/123/posts`:

- At depth 3, base is `./src/user/123/posts`

- At depth 2, base is `./src/user/123`

- At depth 1, base is `./src/user`

- At depth 0, base defaults to `./src`

`candidates`: An array defining the target files checked on the file system during the current iteration. The router checks for a clean file match first, followed by an `.html` file variation. If the loop reaches depth 0, it falls back to checking for the default root entry point `./src/index.html`.

- URL `/user.js` is mapped to `./src/user.js` file

- URL `/user` is mapped to `./src/user.html` file

- URL `/` is mapped to `./src/index.html` file

### Filesystem State Verification

```js
for (const candidate of candidates) {
  let exists = caches.routes.get(candidate)
  if (exists === undefined) {
    try { exists = (await Deno.stat(candidate)).isFile } catch { exists = false }
    !config.isDev && caches.routes.set(candidate, exists)
  }
```

`caches.routes.get(candidate)`: Inspects the route memory map to see if the file status of the candidate path is already known.

`Deno.stat(candidate)`: If the cache returns `undefined`, the server directly queries the operating system to confirm whether the candidate path exists on disk and is a valid file. If the file is missing or inaccessible, the error is caught safely, and `exists` is set to `false`.

`caches.routes.set(...)`: In production, the boolean result of the file check is saved to memory. Subsequent requests for this path skip the file system completely, avoiding disk reading.

### Match Finalization and Parameter Extraction

```js
    if (exists) {
      const result = { route: candidate, params: segments.slice(depth) }
      return (!config.isDev && caches.paths.set(pathname, result), result)
    }
  }
}
const fallback = { route: null, params: [] }
return (!config.isDev && caches.paths.set(pathname, fallback), fallback)
```

`params: segments.slice(depth)`: When a candidate file is confirmed to exist, the traversal stops. Any remaining URL segments located to the right of the matched file depth index are extracted as dynamic parameters. For example, if `/user/123/posts` matches a physical file at `./src/user.html` (depth 1), the remaining segments `['123', 'posts']` are captured into the params array.

`caches.paths.set(pathname, result)`: Saves the completed resolution object into the path cache in production mode, ensuring future identical requests resolve with an $O(1)$ lookup speed.

`fallback`: If the loop finishes without finding a physical file match inside the `./src` folder, the function returns a null-route configuration, signaling the execution engine to issue a standard `404 Not Found` response downstream.