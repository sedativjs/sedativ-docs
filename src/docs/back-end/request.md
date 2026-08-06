## Request

```js
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
```

`resolveRequest`: Normalizes a standard incoming web Request object into a uniform object containing all necessary execution metadata.

### Method, Headers, Url, Pathname, Route, Params

```js
const { method, headers, url } = request
const { pathname, searchParams } = new URL(url)
const { route, params } = await resolveRoute(pathname)
```

`method, headers, url`: Extracted directly from the standard incoming network request object via object destructuring.

`new URL(url)`: Uses the standard web URL utility to parse the full location string into individual components.

`pathname`: Isolates the clean path string (such as `/user/profile`) while stripping away any trailing URL query parameters.

`resolveRoute(pathname)`: Invokes the file-system router using the extracted path to locate a physical matching asset within the `./src` directory.

`route, params`: Captures the validated disk path string and populates the `params` array with any remaining trailing URL elements left over from the `route` match.

### Extension, Mime, Type

```js
const ext = route ? route.split('.').pop() || '' : ''
const mime = mimeText[ext] || mimeBinary[ext] || 'application/octet-stream'
const type = Object.keys(parsers).find(type => headers.get('content-type')?.includes(type)) || 'default'
```

`ext`: Finds the target file extension by splitting the resolved route string by its periods and taking the final element. If the route has no extension or is missing, it returns an empty string.

`mime`: Checks the isolated extension against the internal text and binary dictionaries to assign a matching content type header. If the extension is unrecognized, it defaults to `application/octet-stream`.

`type`: Scans the keys of the configured request body parsers to see if any match the string value inside the incoming `content-type` header. If the header is missing or unsupported, it falls back to the `'default'` string identifier.

### Query, Cookies, Body

```js
const query = Object.fromEntries(searchParams)
const cookies = Object.fromEntries((headers.get('cookie') || '').split('; ').filter(Boolean).map(c => (c.includes('=') ? c : c + '=').replace('=', '\x00').split('\x00')))
const body = request.body ? await parsers[type](request).catch(() => parsers.default(request)) : ''
```

`query`: Packs the URL search keys and values into a standard flat object using `Object.fromEntries()`.

`cookies`: Parses the incoming HTTP Cookie header string into a key-value object. It splits cookies using a `;`  spacer, discards empty entries, ensures each item contains an assignment operator `=`, replaces the first `=` with a hidden null-byte character `(\x00)`, and splits on that null byte. This isolates cookie names from their values safely without using regular expression.

`body`: Evaluates if the incoming request contains an active body data stream. If present, it executes the corresponding content parser. If the payload stream reading fails or is malformed, the `.catch()` block intercepts the failure and returns a plain text string instead.

### Locals, Context Assembly

```js
return { method, headers, url, pathname, ext, mime, type, route, params, query, cookies, body, locals: {} }
```

`locals`: An empty object literal generated fresh for every request. This property creates an isolated workspace where custom middleware functions or database interceptors can store data (like user account items) across the lifespan of the request.

`return { ... }`: Aggregates the raw HTTP details, filesystem targets, structural route arrays, query variables, cookie records, decoded bodies, and local objects into a single, uniform request context passed to downstream handlers.