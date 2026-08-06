# Client-side

Every state change passes through a single, unified reactive tracker:

<img src="/assets/mermaid-diagram-client-side.svg" alt="Client-side diagram" style="width: 100%; max-height: 100vh; margin: var(--size-1) 0">

By relying directly on browser-native HTML parsing, component execution bypasses virtual DOM diffing and build-time compilation steps.

- **Asynchronous Component Streaming**: HTML streams from the network and constructs DOM nodes sequentially. The browser renders unrecognized tags (such as `<hello-world>`) immediately as standard `HTMLElement` nodes without blocking page layout or causing errors.

- **Native Element Upgrades**: When an asynchronous script module executes and registers a tag name via `$()`, the browser automatically upgrades matching HTML nodes already present in the DOM, running their lifecycle hooks and reactive rendering routines.

- **Zero Loading Boilerplate**: Progressive element upgrades happen automatically at the browser engine level, eliminating code-splitting wrappers, asset preloaders, or dynamic import boilerplate.

```js
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="/global.css">
  <script type="module" src="/main-layout.js"></script>
</head>
<body>
  <main-layout></main-layout>
</body>
</html>
```

`<script type="module" src="/main-layout.js"></script>`: Loads component definitions using a native ES module script. Pages can load multiple script modules directly or rely on a single entry point file.

`<main-layout></main-layout>`: Arbitrary HTML element node. The tag name matches the string tag identifier passed to `$()` (for example, `$(ref => {}, 'main-layout')`).

```js
// /main-layout.js
import './read-me.js'

$(ref => {
  ref.html`
    <h1>Readme: </h1>
    <read-me></read-me>
  `
}, 'main-layout')
```

```js
// /read-me.js
import { marked } from "https://esm.sh/marked"

$(async ref => {
  const readme = $(await (await fetch('/README.md')).text())
  ref.html`
    ${marked.parse(readme())}
    <best-quote></best-quote>
  `
}, 'read-me')

$(ref => {
  ref.html`
    <blockquote>
      There is only one reliable way to speed up your code, and that is to get rid of it ~ Rich Harris, creator of Svelte
    </blockquote>
  `
}, 'best-quote')
```

`import './read-me.js'`: Imports child component files. Executing a component module registers its custom element tags with the browser globally. Components are executed as side-effect imports rather than assigned to named JavaScript variables:

- `import './read-me.js'` // Correct

- `import ReadMe from './read-me.js'` // Incorrect ❌

`$(... 'read-me')` and `$(... 'best-quote')`: Component definitions operate independently of the file names containing them. Multiple components can be declared inside a single file, but for maintainability, the recommended practice is:

- Isolating one component per file.

- Naming the file after the custom element tag (for example, `read-me.js` for `'read-me'` component).