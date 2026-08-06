## Cache

```js
// cache.mjs
export default req => {
  const cache = { duration: 0, maxSize: 1024 * 1024 }

  if (req.pathname === '/api.mjs') cache.duration = 1000 * 10 // cache for 10 seconds with default maximum size
  if (req.pathname === '/') cache.duration = 1000 * 60 * 10 // cache for 10 minutes with default maximum size
  if (req.pathname === '/global.css') {
    cache.duration = 1000 * 60 * 60 * 10 // cache for 10 hours
    cache.maxSize = 1024 * 1024 * 2 // cache maximum 2 megabytes
  }

  return cache
}
```

`cache.mjs`: Stores requested resources in server memory and provides HTTP header instructions so browsers know how long to retain local copies.

`cache = { duration: 0, maxSize: 1024 * 1024 }`: Sets default caching parameters. By default, duration is `0` (disabled) and maximum asset size for RAM storage is `1 megabyte` (1048576 bytes).

`req.pathname`: Inspects the requested URL path to apply custom caching rules to specific routes.

`cache.duration`: Defines how long (in milliseconds) an asset remains cached in memory and browser storage before requiring revalidation.

`cache.maxSize`: Defines the maximum allowed size (in bytes) for a file to be stored in RAM, preventing large files from exhausting server memory.

### Server-Browser Synchronization

```js
// main.mjs
const cacheControl = cache.duration > 0
  ? `public, max-age=${Math.floor(cache.duration / 1000)}, must-revalidate`
  : 'no-store'
const etag = `W/"${stat.mtime.getTime()}-${stat.size}${cache.duration > 0
  ? `-${Math.floor(now / cache.duration)}`
  : ''}"`
```

`cacheControl`: Builds the standard HTTP `Cache-Control` header. If `duration` is greater than `0`, it converts milliseconds into seconds for the `max-age` directive. If set to `0`, it applies `no-store` to prevent client caching.

`etag`: Constructs a unique string using the file modification timestamp, total file size, and current cache time bracket to ensure browser validation tokens stay synchronized with server state changes.