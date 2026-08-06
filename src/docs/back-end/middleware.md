## Middleware

```js
// middleware.mjs
const addRequestDate = req => req.locals.requestDate = new Date().toUTCString()
const logRequest = req => console.log(req)
const restrictAccess = req => req.pathname === '/' && new Response('Restricted by middleware')

export default async (req) => {
  addRequestDate(req)
  logRequest(req)
  return restrictAccess(req)
}
```

`middleware.mjs`: Intercepts all incoming server traffic. It provides a central place to modify request data, log server events, or block unauthorized requests early.

`req.locals`: An object attached to the request specifically for storing custom runtime data. Because objects are passed by reference, any data added here is immediately available to downstream handlers and endpoints.

`addRequestDate(req)`: Demonstrates how to attach custom metadata (such as a UTC timestamp) to the request object.

`logRequest(req)`: Demonstrates how to log request information directly to the terminal for debugging.

`restrictAccess(req)`: Demonstrates how to enforce access restrictions.

### Interception and Early Returns

```js
// middleware.mjs
const restrictAccess = req => req.pathname === '/' && new Response('Restricted by middleware')
```

`req.pathname`: Inspects the target route `pathname` assigned during initial request resolution.

`new Response(...)`: Generates a standard Web API `Response` object.

`return restrictAccess(req)`: Returns the evaluation result back to the server loop. If a middleware function returns a valid `Response` instance, execution halts immediately, skipping cache lookup and resource resolution to send that response directly to the client.