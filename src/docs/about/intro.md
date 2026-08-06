<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/sedativjs/sedativ-docs/main/src/assets/sedativ-logo-light.svg"/>
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/sedativjs/sedativ-docs/main/src/assets/sedativ-logo-dark.svg"/>
  <img src="https://raw.githubusercontent.com/sedativjs/sedativ-docs/main/src/assets/sedativ-logo-light.svg" alt="Sedativ Logo" width="400" height="500"/>
</picture>

<div data-nosnippet>

If you remember the good old days of jQuery, you may recall a pattern like this:

```js
$("div").text("Hello World");
```

Well, this time we will use `$()` to set reactive components on the client-side:

```js
$(ref => html`<div>Hello Kitty</div>`, 'hello-kitty')
```

We will also use `$()` to create endpoint handlers on the server-side:

```js
$(res => new Response('Hello Kitty'))
```

</div>

Sounds interesting? Let me introduce Sedativ — a full-stack framework for developers sick of fool-stuck frameworks.

# Intro

Instead of selling heavy abstractions, this documentation aims to explain exactly how the framework operates internally, under the hood, line by line. Most frameworks document surface-level features; here you get the underlying mechanics, and this is basically an executable specification, not black-box bloatware with a "convention over comprehension" attitude.

Sedativ requires only **Deno** (v2.6.0 or newer) and a browser that supports **Web Components** (from 2020 onward). Aside from Deno itself, it is completely **dependency-free**. It does not use external packages or third-party tools (such as Vite), yet it still provides the capabilities you can expect.

In around **300 lines of code**, you get:

- File-based routing with dynamic segments
- Automatic request parsing
- Static file streaming and Gzip compression
- API endpoint handling and middleware queue
- Server-side and client-side caching
- IP-based rate limiting
- Automatic security headers
- Hot reloading during development
- Reactive signal-based front-end engine
- Client-side routing with link preloading

This way Sedativ is functionally comparable to tools like:

- Astro + Lit
- Next.js / React
- Nuxt / Vue.js
- SvelteKit / Svelte
- SolidStart / Solid

___

The entire framework is driven by 8 functions (6 server-side and 2 client-side):

`resolveRoute(pathname)`: Matches URL paths to files inside `src` folder and extracts trailing segments as dynamic parameters.

`resolveRequest(request)`: Parses HTTP requests into clean objects containing query parameters, cookies, and decoded bodies.

`resolveRuntime(req, cache, stat)`: Evaluates `.mjs` server handlers, injects client runtime scripts into `.html` files, or loads static assets.

`resolveResource(req, cache)`: Reads files from disk, calculates ETag and cache headers, and keeps small assets in memory.

`resolveResponse(request)`: The main HTTP entrypoint that handles rate limiting, middleware, endpoint execution, and Gzip compression.

`resolveReload(timer, clients)`: Watches `src` folder for file changes in development mode and sends a WebSocket signal to reload the browser.

`reifier(value, tag, effects, range)`: The client-side engine that manages reactive signals and registers custom `Web Components`.

`router()`: Drives single-page navigation, preloading component modules on link hover and managing browser history.

___

Sedativ uses a static-first, island-based, progressively enhanced web architecture - the server handles API endpoints and streams static files, while the client hydrates reactive components asynchronously. Static pages remain identical for all users, while hydrated components manage individual state.

This single, predictable rendering strategy means you do not have to choose between:

\- ~~Client-Side Rendering~~\
\+ No initial DOM created by JS; HTML exists and works without JS layers\
\- ~~Server-Side Rendering~~\
\+ No per-request rendering engine or server-side component logic execution\
\- ~~Single Page Application~~\
\+ No single application root requirement or mandatory JS navigation\
\- ~~Incremental Static Regeneration~~\
\+ No background regeneration tasks or complex revalidation logic\
\- ~~Deferred Static Generation~~\
\+ No page generation latency delays on the first incoming user request\
\- ~~Partial Hydration~~\
\+ No DOM reconciliation processes or duplicate server-rendered markup\
\- ~~Resumability~~\
\+ No massive serialized execution state transfers needed to resume execution\
\- ~~Server Actions~~\
\+ No UI mutations modeled as custom server functions or server-driven template re-renders\
\- ~~Server Components~~\
\+ No component execution graphs split artificially between environments, no heavy RSC pipelines

___

Sedativ leverages web platform standards instead of reinventing them, avoiding vendor-locked tooling or custom languages.

On the client, it provides a light wrapper over standard Web Components to add reactivity and shifting module resolution entirely to the browser instead of relying on a heavy build pipeline.

On the server, it mirrors client-side API design with standard Response objects, keeping routing and endpoint logic clean while operating close to the Deno runtime.

Sedativ enforces a strict separation of concerns - you always know where code executes just by checking the file extension.

The idea is simple:

***.mjs*** **files run on the server side and have direct access to the parsed request** ***req***:

```js
// sample-endpoint.mjs

// import whatever you want:
import data from './data.json' with { type: 'json' }
// create api handler:
$(req => {
  // use parsed Request:
  const { method, body } = req
  if (method === 'POST') {
    // return native Response:
    return new Response(
      JSON.stringify({ body, data, redirect: '/' }),
      { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' } }
    )
  }
})
```

***.js*** **files run on the client side and have direct access to the component reference** ***ref***:

```js
// sample-component.js

// create reactive signal:
const count = $(0)
// define web component:
$(ref => {
  // add template:
  ref.html`
    <button data-action="-">-</button>
    <span>${count()}</span>
    <button data-action="+">+</button>
  `
  // add event:
  ref.onclick = event => {
    const { action } = event.target.dataset
    // change signal value to re-render template:
    action === '-' && count(count() - 1)
    action === '+' && count(count() + 1)
  }
// create web component:
}, 'sample-component')
```

The entire abstraction layer is unified under a single polymorphic function `$` and a router utility `_`. There is no other API to learn, and there will be no breaking changes.