# Server-side

Every incoming request passes through a streamlined, automated execution pipeline:

<img src="/assets/mermaid-diagram-server-side.svg" alt="Server-side diagram" style="width: 100%; max-height: 100vh; margin: var(--size-1) 0">

The server maps requests directly to physical files inside the `src/` directory, processing them through lightweight interceptors while optimizing performance with automatic ETag validation and on-the-fly Gzip compression.

- **Zero-Configuration Routing**: `src/` folder structure dictates application's URLs. There are no routing tables, central config manifests, or complex regular expressions to maintain.

- **Parameter Backtracking**: URL parameters are parsed by scanning backward from the end of the web path. If a URL contains extra segments that extend past a physical file on disk, the router stops backtracking, targets that file, and hands the remaining paths as a clean `params` array. This completely eliminates naming hacks like `[id]` or `:id`.

- **Extension-Driven Execution**: File types dictate behavior. A `.mjs` file runs dynamic server-side logic, a `.html` file triggers layout hydration, and binary assets (like images or zip files) are streamed directly to the client.

By containing all routable files strictly within the `src/` directory, configuration files like `deno.json` or `package.json` stay securely isolated at the project root.

## Routing Rules

Given this project structure:

```
main.mjs
src/
├─ index.html
├─ user.html
├─ user.js
├─ user.mjs
└─ user/
   ├─ posts.html
   ├─ posts.js
   └─ posts.mjs
```

The server resolves incoming request URLs to physical files and parameter objects according to these rules:

| Incoming Request URL | Resolved File Route | Params | Query |
| :--- | :--- | :--- | :--- |
| `/` | `./src/index.html` | `[]` | `{}` |
| `/user` | `./src/user.html` | `[]` | `{}` |
| `/user/` | `./src/user.html` | `[]` (trailing slash stripped) | `{}` |
| `/user.html` | `./src/user.html` | `[]` | `{}` |
| `/user.js` | `./src/user.js` | `[]` (served as static text) | `{}` |
| `/user.mjs` | `./src/user.mjs` | `[]` (executed as a dynamic endpoint) | `{}` |
| `/user/posts` | `./src/user/posts.html` | `[]` | `{}` |
| `/user/posts.mjs/1` | `./src/user/posts.mjs` | `[1]` | `{}` |
| `/user/posts.mjs/1/comments/2?sort=new` | `./src/user/posts.mjs` | `['1', 'comments', '2']` | `{ sort: 'new' }` |
| `/user/posts.mjs/1/comments/2?sort=new&sort=top` | `./src/user/posts.mjs` | `['1', 'comments', '2']` | `{ sort: 'top' }` |