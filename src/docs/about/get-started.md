## Get Started

### Install Deno

Sedativ is a Deno-native framework. If you do not have Deno installed on your machine yet, open your terminal and execute the command for your operating system:

```shell
# Windows:
irm https://deno.land/install.ps1 | iex

# Linux/MacOS
curl -fsSL https://deno.land/install.sh | sh
```

Ensure your installation is updated to at least version 2.6.0 by running `deno --version`.

### Initialize Project

```
main.mjs
src/
└─ index.html
```

To start a new full-stack project, you only need two files (everything else is optional):

- `main.mjs`: Contains the framework server code.

- `index.html`: Standard HTML structure placed inside the `src` folder.

This is literally all it takes.

- No CLI initializers or complex scaffolding tools.

- No external packages to install bloating your disk.

### Run Server

```shell
deno serve -A --env-file --watch main.mjs
```

To spin up the server locally, navigate to your project's root directory and execute `deno serve`:

`deno serve`: Uses Deno's native server runner, binding an HTTP server directly to the fetch handler exported by `main.mjs`.

`-A`: Grants permissions to bind network ports, read files from disk, and listen to filesystem events.

`--env-file`: Automatically loads environment variables from a root `.env` file into `Deno.env`.

`--watch`: Restarts the server process instantly whenever modifications are saved in any script or asset.

The server entrypoint `main.mjs` uses a single port (`8000` by default) to handle both:

- **Application Traffic**: Standard HTTP requests pass directly into `resolveResponse(req)` for file streaming, component rendering, and API evaluation.

- **Live Reload Traffic**: In development mode (`config.isDev`), requests targeting `/_reload` are intercepted and upgraded to a WebSocket connection, instantly reloading the browser whenever a file is saved.

```js
// main.mjs
export default { 
  fetch: request => request.url.endsWith('/_reload') && reloadServer ? reloadServer(request) : resolveResponse(request) 
}
```

There are no separate `dev`, `build`, or `preview` scripts. Sedativ uses raw JavaScript modules, meaning:

- No bundler is involved.

- Build time is **0ms**.

- Your source code is already production code.

Framework behavior is controlled via the `DENO_ENV` environment variable:

| Feature | Development Mode | Production Mode |
| :--- | :--- | :--- |
| Routing Cache | Disabled (Live file reads on every request) | Enabled (Warm module cache for peak throughput) |
| Live Reload | Enabled (Auto-refreshes browser on save) | Disabled (Route ignored to eliminate socket overhead) |
| Performance Profile | Optimized for instant iteration | Optimized for raw delivery |

### Add Environment Variables

By default, the server runs in Development Mode. To switch to Production Mode, set `DENO_ENV=production` inside a `.env` file in your project root:

```shell
# .env
DENO_ENV=production
```

When launching the server, ensure the `--env-file` flag is included so Deno reads these values on startup.

⚠️ Ensure `.env` is listed in `.gitignore` to prevent committing environment files to source control.

### Setup Tooling

Sedativ uses native JavaScript template literals for HTML components. To enable syntax highlighting inside template literals, install an extension such as [es6-string-html](https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html) in VS Code or an equivalent plugin for your chosen text editor. This will highlight HTML markup written inside JavaScript string templates.

Sedativ is extremely compact, so its entire architectural footprint should fit into a single LLM context window. If you are using an AI to help build features, simply append `main.mjs` file directly to a prompt context. Because there is no hidden abstraction or proprietary layers, the AI should understand framework's exact mechanics precisely.