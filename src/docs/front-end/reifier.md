## Reifier

```js
export let reifier = (value, tag, effects = new Set(), range = document.createRange()) => {
  let remove = () => (
    reifier && effects.clear(),
    reifier = null
  )
  const render = ref => (
    reifier = () => value(ref),
    (rm => typeof rm === 'function' ? remove = rm : rm?.then?.(r => typeof r === 'function' && (remove = r)))(value(ref)),
    reifier = null
  )
  const reload = async (ref, strs, vals) => {
    const runHook = async (hook) => Promise.all([hook?.()].flat().map(anim => anim?.finished ?? anim))
    await runHook(ref.exit)
    ref.replaceChildren(range.createContextualFragment(strs.map((str, i) => str + (vals[i] ?? '')).join('')))
    await runHook(ref.enter)
  }

  typeof value === 'function' && !tag
    ? (render(), remove())
    : (tag && !customElements.get(tag) && customElements.define(tag, class extends HTMLElement {
      connectedCallback() { render(this) }
      disconnectedCallback() { remove(this) }
      html(strs, ...vals) { reload(this, strs, vals) }
    }))

  typeof value !== 'function' && tag && (localStorage.getItem(tag)
    ? value = JSON.parse(localStorage.getItem(tag))
    : localStorage.setItem(tag, JSON.stringify(value)))

  return newValue => newValue === undefined
    ? (reifier && effects.add(reifier), value)
    : (value = newValue, tag && localStorage.setItem(tag, JSON.stringify(value)),
      queueMicrotask(() => effects.forEach(fn => fn())), value)
}
```

`reifier` is a lightweight engine for state management, local browser persistence, reactive tracking, and custom element registration. Its behavior adapts depending on the arguments provided:

- `$(value)`: **Reactive Signal** - Stores state and tracks subscriber functions that read it.

- `$(value, 'key-name')`: **Persistent Signal** - Syncronizes reactive state with browser `localStorage`.

- `$(fn)`: **Reactive Side-Effect** - Executes a function immediately and re-runs it whenever signals inside update.

- `$(fn, 'tag-name')`: **Web Component** - Registers a native custom HTML element tied to a render function.

### Function Signature

```js
export let reifier = (value, tag, effects = new Set(), range = document.createRange()) => { ... }
```

`value`: Holds the initial primitive value, state object, or component/effect function.

`tag`: Optional string used either as a Web Component HTML tag name or a localStorage key.

`effects`: A unique list (`Set`) that stores subscriber functions listening to the signal instance.

`range`: A native browser DOM range instance used to parse raw HTML strings into live DOM elements.

### Internal Execution

```js
let remove = () => (
  reifier && effects.clear(),
  reifier = null
)
const render = ref => (
  reifier = () => value(ref),
  (rm => typeof rm === 'function' ? remove = rm : rm?.then?.(r => typeof r === 'function' && (remove = r)))(value(ref)),
  reifier = null
)
const reload = async (ref, strs, vals) => {
  const runHook = async (hook) => Promise.all([hook?.()].flat().map(anim => anim?.finished ?? anim))
  await runHook(ref.exit)
  ref.replaceChildren(range.createContextualFragment(strs.map((str, i) => str + (vals[i] ?? '')).join('')))
  await runHook(ref.enter)
}
```

`remove`: Handles resource teardown and context cleanup when a component unmounts or an effect is destroyed.

- `effects.clear()`: Empties all subscribed functions to stop future updates and prevent memory leaks.

- `reifier = null`: Resets the active tracking context.

`render`: Executes side effects or component render functions while recording active signal dependencies and capturing cleanup closures.

- `reifier = () => value(ref)`: Sets a global reference to the active render pass so any signals read during execution record it as a subscriber.

- `value(ref)`: Runs the component or effect function, passing the DOM element reference if available.

- `rm => typeof rm === 'function' ...`: Captures cleanup functions returned by components (handles both standard functions and resolved Promises).

- `reifier = null`: Clears the global reference after execution finishes.

`reload`: Handles DOM template updates and asynchronous visual transitions when component content changes.

- `runHook`: Normalizes lifecycle functions, promises, or CSS animations into a list and waits for them to complete using Promise.all.

- `await runHook(ref.exit)`: Runs and awaits before the DOM nodes exit the page.

- `strs.map(...).join('')`: Merges template literal strings and dynamic values into a raw HTML string.

- `range.createContextualFragment(...)`: Parses raw HTML strings directly into live DOM nodes.

- `ref.replaceChildren(...)`: Swaps old DOM children with the new DOM nodes in a single browser update step.

- `await runHook(ref.enter)`: Runs and awaits after new DOM nodes enter the page.

### Component and Effect Registration

```js
typeof value === 'function' && !tag
  ? (render(), remove())
  : (tag && !customElements.get(tag) && customElements.define(tag, class extends HTMLElement {
    connectedCallback() { render(this) }
    disconnectedCallback() { remove(this) }
    html(strs, ...vals) { reload(this, strs, vals) }
  }))
```

`typeof value === 'function' && !tag`: Identifies standalone reactive effects (functions without an HTML tag name).

`(render(), remove())`: Executes the effect once to collect initial signal dependencies, then stores its cleanup function.

`customElements.define(tag, ...)`: Registers a new custom HTML element with the browser if it hasn't been defined yet.

`connectedCallback()`: Fires automatically when the custom element enters the DOM, running `render(this)`.

`disconnectedCallback()`: Fires automatically when the custom element leaves the DOM, running `remove(this)`.

`html(strs, ...vals)`: Attaches the template parser to the element instance for HTML updates.

### Browser Storage Persistence

```js
typeof value !== 'function' && tag && (localStorage.getItem(tag)
  ? value = JSON.parse(localStorage.getItem(tag))
  : localStorage.setItem(tag, JSON.stringify(value)))
```

`localStorage.getItem(tag)`: Checks browser storage for saved data using the tag string as the key.

`JSON.parse(...)`: Loads existing data from storage, overriding the initial default value.

`localStorage.setItem(...)`: Saves the initial default value to browser storage if no data exists yet.

### Signal Getter and Setter

```js
return newValue => newValue === undefined
  ? (reifier && effects.add(reifier), value)
  : (value = newValue, tag && localStorage.setItem(tag, JSON.stringify(value)),
    queueMicrotask(() => effects.forEach(fn => fn())), value)
```

`newValue === undefined`: **Getter mode**

- `effects.add(reifier)`: If an effect or component is currently running, registers it to re-run whenever this value changes.

- `value`: Reading the signal with no arguments returns the current value.

`newValue !== undefined`: **Setter mode**

- `value = newValue`: Passing an argument updates the internal state value.

- `localStorage.setItem(...)`: Automatically updates saved data in localStorage if persistence is enabled for this signal.

- `effects.forEach(fn => fn())`: Calls each registered subscriber function once to trigger its update logic.

- `queueMicrotask(...)`: Defers subscriber calls until current code finishes executing. This batches multiple state changes into a single DOM update pass.