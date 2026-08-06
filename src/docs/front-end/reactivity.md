## Reactivity

```js
let signal = $()
signal()
signal(value)
```

The reactivity system uses signals (reactive function closures) to track dependencies and update the UI automatically without manual render calls.

`let signal = $()`: Creates a new reactive signal. Defaults to undefined if no initial value is provided.

`signal()`: **Getter** - Reads the current value. If called inside a component or side effect, it registers that caller as a dependent subscriber.

`signal(value)`: **Setter** - Updates the internal state value and schedules all subscribed components and effects to re-run.

### Side Effects

```js
let count = $(1)

$(() => {
  console.log(`The counter value is currently: ${count()}`)
})

count(count() + 1)
```

`count()`: Reading the value with no arguments registers the active execution scope (such as a side effect callback) as a subscriber.

`count(count() + 1)`: Passing an argument updates the signal value. Because the same signal acts as both getter and setter, reading `count()` inside the setter call updates the state relative to its current value.

`$(() => { ... })`: Passing a function without a tag string creates a side effect. It runs immediately to record signal dependencies, then re-runs automatically whenever any of those signals change.

### Shared State

```js
// /shared-state-example.js
export let count = $(0)

$(ref => {
  ref.html`
    <div class="display">Shared Value: ${count()}</div>
  `

  ref.onclick = event => count(count() + 1)
}, 'shared-state-example')
```

`export let count = $(0)`: Declares a global signal outside component functions. Because signals are standalone functions, they can be exported and imported across JavaScript files. Any component reading an imported signal updates automatically when that signal changes, eliminating the need for third-party state management libraries.

⚠️ This built-in behavior completely eliminates the need for complex external global state management libraries (like Redux or Pinia) that other frameworks may force you to adopt.

### Local State

```js
// /local-state-example.js
$(ref => {
  let counter = $(0)

  $(() => ref.html`
    <button>Clicks: ${counter()}</button>
  `)

  ref.onclick = event => counter(counter() + 1)
}, 'local-state-example')
```

`let counter = $(0)`: Declares state inside the component function scope, creating an isolated state instance for each mounted custom element.

`$(() => ref.html...)`: Component setup functions run once when an element attaches to the DOM. Wrapping `ref.html` inside a nested side effect `$(() => ...)` registers local signals with the tracking loop, ensuring the DOM updates whenever `counter()` changes.

### Derived State

```js
// /derived-state-example.js
let count = $(2)

let doubled = $(0)
$(() => doubled(count() * 2))

$(ref => {
  let quadrupled = $(0)
  $(() => quadrupled(doubled() * 2))

  $(() => ref.html`
    <button>Multiply Numbers</button>
    <p>Base: ${count()} | Double: ${doubled()}</p>
  `)

  ref.onclick = event => {
    if (event.target.tagName === 'BUTTON') count(count() + 1)
  }
}, 'derived-state-example')
```

`$(() => doubled(count() * 2))`: Computes derived values by using standard reactive side effects. When the base signal `count()` updates, it triggers its direct effect, which updates `doubled()`, cascading state updates cleanly before the microtask queue executes the final layout updates.

`$(() => quadrupled(doubled() * 2))`: Creates local derived state inside a component. Derived state can depend on global signals, local signals, or other derived signals.

### Persistent State

```js
// /persistent-state-example.js
let theme = $('dark', 'app-user-theme')

$(ref => {
  ref.html`
    <div class="panel ${theme()}">
      <p>Active Layout Theme: ${theme()}</p>
      <button>Toggle Theme</button>
    </div>
  `

  ref.onclick = event => {
    if (event.target.tagName === 'BUTTON') {
      theme(theme() === 'dark' ? 'light' : 'dark')
    }
  }
}, 'persistent-state-example')
```

`$('dark', 'app-user-theme')`: Passing a string key as the second argument enables browser storage persistence. Upon initialization, the engine reads `localStorage` for a specified key. If found, it hydrates the signal with the saved JSON value; otherwise, it uses the provided fallback.

`theme(...)`: Updating a persistent signal automatically serializes the new value to `localStorage under` the registered key, ensuring data remains intact across browser reloads or restarts.

### Lifecycle

```js
// /local-time.js
$(ref => {
  let time = $(new Date().toLocaleTimeString())

  let timer = setInterval(() => time(new Date().toLocaleTimeString()), 1000)

  $(() => ref.html`<p>Current Time: ${time()}</p>`)

  return () => {
    console.log('Clock element removed from screen. Clearing timer...')
    clearInterval(timer)
  }
}, 'local-time')
```

```js
// /lifecycle-example.js
import './local-time.js'

let show = $(false)

$(ref => {
  ref.html`
    <button>${show() ? 'Hide' : 'Show'}</button>
    ${show() ? `<local-time></local-time>` : ''}
  `

  ref.onclick = event => {
    if (event.target.tagName === 'BUTTON') show(!show())
  }
}, 'lifecycle-example')
```

`$(ref => { ... }, 'local-time')`: The component setup code runs immediately when the element mounts to the DOM (driven by the native `connectedCallback`).

`return () => { ... }`: Returning a cleanup function from the component setup code registers teardown logic. The engine automatically calls this function when the element unmounts from the DOM (driven by the native `disconnectedCallback`), safely clearing timers, intervals, or event listeners.

### Async Components

```js
// /async-components-example.js
$(async ref => {
  let data = $('Loading resource...')

  $(() => ref.html`<div>${data()}</div>`)

  try {
    const response = await fetch('/api/resource')
    const result = await response.json()

    data(result.message)
  } catch (error) {
    data('Failed to load resource...')
  }

  return () => console.log('Cleaning up async component resource...')
}, 'async-components-example')
```

`async (ref) => { ... }`: Defines an asynchronous component. Code up to the first `await` keyword executes synchronously, rendering initial loading states and setting up signal subscribers immediately on mount.

`await fetch('/api/resource')`: Pauses the component's execution thread while waiting for the network promise to resolve. When resolved, execution resumes, updating reactive signals and refreshing the layout.

`return () => ...`: Async components support cleanup returns natively. The engine awaits the setup promise, extracts the returned cleanup function, and registers it to run when the component unmounts from the DOM.