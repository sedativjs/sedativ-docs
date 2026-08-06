## Endpoints

```js
// /endpoint.mjs
$(req => {
  if (req.method === 'POST') {
    return new Response(
      JSON.stringify({ message: 'POST request' }),
      { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' } }
    )
  }

  return new Response(
    'GET request',
    { status: 200, statusText: 'OK', headers: { 'content-type': 'text/plain' } }
  )
})
```

`.mjs`: Files mapped directly to file system routes. Instead of serving static HTML files, they run server-side logic and return raw data.

`$( ... )`: Wraps server code and provides access to the pre-parsed `req` object.

`req`: Contains details about the incoming HTTP request, including route parameters, cookies, HTTP methods, and body payloads.

`$(async req => { ... })`: Async before `req` is used when route needs to use `await` to query databases or make external API calls.

`if (req.method === 'POST')`: Checks the incoming HTTP method to handle different request types (such as `GET`, `POST`, `PUT`, or `DELETE`) within the same file.

`new Response(...)`: Creates and returns a standard Web API `Response` object. Endpoints must return a valid `Response` instance; returning plain objects or strings directly will cause the server to return a `403 Forbidden` response.

`JSON.stringify(...)`: Converts JavaScript objects into JSON strings so they can be sent over the network.

`headers: { 'content-type': '...' }`: Sets the MIME type of the response so the browser or client application knows how to read the incoming data.

### Header Merging and Security

```js
// main.mjs
Object.entries(responseHeaders).forEach(([key, val]) => key.toLowerCase() === 'set-cookie'
  ? handler.headers.append(key, val)
  : !handler.headers.has(key) && handler.headers.set(key, val))
```

`Object.entries(responseHeaders).forEach(...)`: Loops through default server headers (like security rules) to merge them into the endpoint's response.

`key.toLowerCase() === 'set-cookie'`: Checks if a header is setting a cookie.

`handler.headers.append(...)`: Appends new cookies alongside existing ones so multiple cookies can be set in a single response without overwriting each other.

`!handler.headers.has(key) && handler.headers.set(...)`: Checks if the endpoint handler already set a custom header. If a custom header is explicitly defined in the endpoint, it takes priority; otherwise, the server applies the default security setting.