## Referencing

```js
<parent-component>
  <children-component data-id="1"></children-component>
  <children-component data-id="2"></children-component>
</parent-component>
```

Sedativ uses native W3C Web Components internally. Nesting, reusing, and connecting components relies entirely on standard browser HTML capabilities.

### Props (Attributes)

```js
// /detail-card.js
import { users } from './props-example.js'

$(ref => {
  const title = ref.getAttribute('card-title')
  const { userId = 0 } = ref.dataset

  $(() => ref.html`
    <h3>${title}</h3>
    <p>Id: ${userId}</p>
    <p>Status: ${users[userId].active ? 'Active' : 'Not Active'}</p>
  `)
}, 'detail-card')
```

```js
// /props-example.js
import './detail-card.js'

export let activeUser = $(1)
export const users = [
  { name: 'User', id: 0, active: false },
  { name: 'Admin', id: 1, active: true }
]

$(ref => {
  $(() => ref.html`
    <detail-card
      card-title="Administrator Account"
      data-user-id="${activeUser()}"
    ></detail-card>
  `)
}, 'props-example')
```

`ref.getAttribute('card-title')`: Passes data down to child components by reading plain-text string attributes directly from the host element during setup.

`ref.dataset`: Accesses attributes prefixed with `data-`. The browser automatically converts hyphenated names (like `data-user-id`) into camelCase keys (like `ref.dataset.userId`).

`$(() => ref.html...)`: Re-evaluates child templates whenever parent signals (like `activeUser()`) change, updating child elements with refreshed attributes.

⚠️ Use Shared State for complex data like objects or arrays. HTML attributes should be reserved strictly for simple strings, boolean flags, or primitive ID lookup keys.

### Emits (Custom Events)

```js
// /reset-button.js
$(ref => {
  ref.html`<button>Reset</button>`

  ref.onclick = event => {
    if (event.target.tagName === 'BUTTON') {
      ref.dispatchEvent(
        new CustomEvent('reset-system', {
          bubbles: true,
          detail: { timestamp: Date.now() },
        }),
      )
    }
  }
}, 'reset-button')
```

```js
// /emits-example.js
import './reset-button.js'

$(ref => {
  ref.html`
    <reset-button></reset-button>
  `

  ref.addEventListener('reset-system', event => {
    console.log(`System reset performed at: ${event.detail.timestamp}`)
  })
}, 'emits-example')
```

`ref.dispatchEvent(...)`: Dispatches custom events directly from the host element to send messages or data updates upward through standard DOM event propagation.

`new CustomEvent('reset-system', { ... })`: Instantiates a standard browser custom event carrying arbitrary payloads inside the detail property object.

`bubbles: true`: Allows the event to propagate upward through parent HTML elements, enabling parent components to intercept it using standard `ref.addEventListener()` listeners, eliminating the need to pass callback functions down through templates.

⚠️ Use Shared State for app data logic. Custom DOM events should be reserved strictly for highly generic, independent UI components, such as overlay modals or standalone controls.

### Slots (Nested Markup)

```js
// /user-profile.js
$(ref => {
  let slot = ref.innerHTML.trim() || `
    <img src="avatar.png" alt="Software Developer avatar" />
    <p>Software Developer</p>
  `

  $(() => ref.html`
    <div class="card">
      <div class="card-header">
        <h3>User Profile</h3>
      </div>
      <div class="card-body">${slot}</div>
    </div>
  `)
}, 'user-profile')
```

```js
// /slots-example.js
import './user-profile.js'

$(ref => {
  ref.html`
    <user-profile>
      <img src="mugshot.png" alt="Vibe Coder mugshot" />
      <p>Vibe Coder</p>
    </user-profile>
    <user-profile></user-profile>
  `
}, 'slots-example')
```

`ref.innerHTML.trim()`: Extracts raw HTML markup written between component tags prior to setup, leveraging standard browser DOM parsing to capture nested slot content automatically.

`$(() => ref.html ... )`: Locks the captured slot string into memory during setup. Subsequent state updates re-evaluate only this inner callback, preventing recursive DOM parsing loops.

`||`: Evaluates to the fallback template if the component tag is instantiated empty.

⚠️ Passing markup captured from `ref.innerHTML` into `ref.html` is secure because the underlying template function sanitizes and parses the markup safely rather than executing raw scripts, protecting against cross-site scripting (XSS) natively.

### Forms

```js
// /forms-example.js
$(ref => {
  const colorName = $('orange')
  const colorSaturation = $(50)
  const isActive = $(false)
  const colorRGB = $('blue')
  const colorCMY = $('magenta')
  const colorHex = $('#00ffff')
  const dateTime = $(new Date().toISOString().slice(0, 16))

  const colorsRGB = ['red', 'green', 'blue']
  const colorsCMY = ['cyan', 'magenta', 'yellow']

  $(() => ref.html`
    <style>
      forms-example form output, forms-example form button {
        display: block;
        margin-top: 32px;
      }
    </style>

    <form action="/api/submit" method="POST">
      <output>Textarea: ${colorName()}</output>
      <textarea name="color-name">${colorName()}</textarea>

      <output>Text: ${colorName()}</output>
      <input type="text" name="color-name" list="colors-rgb" value="${colorName()}">
      <datalist id="colors-rgb">
        ${colorsRGB.map((color) => `<option value="${color}">${color}</option>`).join('')}
      </datalist>

      <output>Number: ${colorSaturation()}</output>
      <input type="number" name="color-saturation" value="${colorSaturation()}">

      <output>Range: ${colorSaturation()}</output>
      <input type="range" name="color-saturation" min="0" max="100" value="${colorSaturation()}"><br>
      <progress min="0" max="100" value="${colorSaturation()}"></progress><br>
      <meter min="0" max="100" value="${colorSaturation()}"></meter>

      <output>Checkbox: ${isActive()}</output>
      <input type="checkbox" name="is-active" id="is-active" value="true" ${isActive() ? 'checked' : ''}>
      <label for="is-active">Is active</label>

      <output>Radio: ${colorRGB()}</output>
      <input type="radio" name="color-rgb" id="color-rgb-red" value="red" ${colorRGB() === "red" ? 'checked' : ''}>
      <label for="color-rgb-red">Red</label>
      <input type="radio" name="color-rgb" id="color-rgb-green" value="green" ${colorRGB() === "green" ? 'checked' : ''}>
      <label for="color-rgb-green">Green</label>
      <input type="radio" name="color-rgb" id="color-rgb-blue" value="blue" ${colorRGB() === "blue" ? 'checked' : ''}>
      <label for="color-rgb-blue">Blue</label>

      <output>Select: ${colorCMY()}</output>
      <select name="colors-cmy">
        ${colorsCMY.map((color) => `<option value="${color}" ${colorCMY() === color ? 'selected' : ''}>${color}</option>`).join('')}
      </select>

      <output>Color picker: ${colorHex()}</output>
      <input type="color" name="color-hex" value="${colorHex()}">

      <output>Datetime-local: ${dateTime() ? new Date(dateTime()).toLocaleString() : ''}</output>
      <input type="datetime-local" name="date-time" value="${dateTime()}">

      <button type="submit">Submit</button>
    </form>
  `)

  ref.onchange = event => {
    const { name, value, checked } = event.target
    name === 'color-name' && colorName(value)
    name === 'color-saturation' && colorSaturation(value)
    name === 'is-active' && isActive(Boolean(checked))
    name === 'color-rgb' && colorRGB(value)
    name === 'colors-cmy' && colorCMY(value)
    name === 'color-hex' && colorHex(value)
    name === 'date-time' && dateTime(value)
  }

  ref.onsubmit = async event => {
    event.preventDefault()
    await fetch(event.target.action, {
      method: event.target.method,
      body: new FormData(event.target),
    })
  }
}, 'forms-example')
```

`ref.onchange`: Captures form input changes globally on the host element via event delegation, updating signals only when users blur inputs or select options to avoid re-rendering on every keystroke.

`$(() => ref.html...)`: Wraps rendering in a reactive effect to re-render DOM nodes whenever local signals update.

`new FormData(event.target)`: Aggregates all named form control values upon submit into a native browser payload, removing the need for manual payload formatting or header configuration.

`<form action="/api/submit" method="POST">`: Serves as a progressive enhancement fallback. If JavaScript fails or is disabled, the browser falls back to a standard full-page form submission request.

⚠️ Running heavy reactive tracking or side effects on every single keystroke when the application only cares about the final submission data adds CPU overhead. Unless building live-search or real-time validation, handle text entry via standard form events.

### Realtime Binding

```js
// /realtime-binding-example.js
$(ref => {
  const email = $('')
  const password = $('')

  $(() => ref.html`
    <form>
      <input type="text" name="email" placeholder="Email" value="${email()}">
      <output class="email-output">Hello ${email() || 'anonymous'}!</output>
      <br>
      <input type="password" name="password" placeholder="Password" value="${password()}">
      <output class="password-output">${password() && password().length < 6 ? 'Password too short' : ''}</output>
      <button type="submit">Submit</button>
    </form>
  `)

  ref.oninput = event => {
    const { name, value } = event.target
    name === 'email' && email(value)
    name === 'password' && password(value)
  }

  ref.onsubmit = async event => {
    event.preventDefault()
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email(), password: password() }),
    })
  }

  ref.enter = () => bind(true)
  ref.exit = () => bind(false)

  const bind = ((focused, restored) => binded => {
    if (!binded) return focused = ref.querySelector(':focus')
    restored = ref.querySelector(`[name="${focused?.name}"]`)
    restored?.focus(), restored?.setSelectionRange(focused?.selectionStart, focused?.selectionEnd)
  })()
}, 'realtime-binding-example')
```

`$(() => ref.html...)`: Binds signals directly to template attributes and text outputs, updating automatically when values change.

`ref.enter = () => bind(true)`: Runs after the DOM updates to restore focus and cursor position.

`ref.exit = () => bind(false)`: Runs right before the DOM updates to capture the active input element.

`ref.oninput`: Catches input events across the form, updating signals on every keystroke.

`ref.onsubmit`: Prevents page reloads on submit and sends current signal values via fetch().

`const bind = ((focused, restored) => binded => { ... })()`: Creates a self-contained helper function that retains focus state between renders.

`if (!binded) return focused = ref.querySelector(':focus')`: Saves the active input during `ref.exit` and exits early before DOM swap.

`restored?.setSelectionRange(...)`: Finds the new input element by name during `ref.enter` and restores cursor position.

⚠️ Instead of using compiled proprietary directives (like `v-model` or `bind:value`), this architecture uses explicit event tracking. If you need real-time data binding on text inputs, use `ref.exit` to save the active input reference and `ref.enter` to restore focus and selection ranges on the replacement node.

### Animations

```js
// /animations-example.js
$(ref => {
  const show = $(true)
  const colors = ['red', 'green', 'blue', 'cyan', 'magenta', 'yellow']

  $(() => ref.html`
    <button>${show() ? 'Hide' : 'Show'}</button>
    ${show() ? colors.map((color) => `<div class="item">${color}</div>`).join('') : ''}
  `)

  ref.onclick = () => show(!show())

  ref.enter = () => fade('normal')
  ref.exit = () => fade('reverse')

  const fade = (direction) => {
    const items = Array.from(ref.querySelectorAll('.item'))
    return items.map((item, i) => item.animate(
      [
        { opacity: 0, transform: 'translateY(-10px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 300,
        easing: 'ease-out',
        fill: 'both',
        delay: direction === 'reverse' ? (items.length - 1 - i) * 60 : i * 60,
        direction,
      }
    ))
  }
}, 'animations-example')
```

`$(() => ref.html...)`: Binds state to the layout, rendering buttons and list items dynamically based on the show signal.

`ref.onclick`: Toggles the boolean signal, automatically triggering the component reload pipeline.

`ref.enter`: Runs immediately after new elements enter the DOM, executing entrance animations on the mounted nodes.

`ref.exit`: Runs right before elements are removed, pausing DOM cleanup until all returned animations finish playing.

`fade(direction)`: Queries target elements and returns an array of animation instances for the lifecycle engine to await.

`item.animate(...)`: Demonstrates native Web Animations API usage, though any animation helper that returns a Promise works identically.

⚠️ Lifecycle hooks automatically await any returned Promise or array of Promises. Because of this built-in behavior, external animation tools like GSAP work out of the box without requiring custom wrappers, adapters, or framework-specific plugins.

### Media

```js
// /video-controls.js
import { timestamp, video } from './media-example.js'

$(ref => {
  const isPlaying = $(false)

  $(() => ref.html`
    <button style="cursor: pointer">${isPlaying() ? '◼' : '▶'}</button>
    <span style="margin-left: 32px">${Math.floor(timestamp())}s</span>
  `)

  ref.onclick = () => isPlaying(!isPlaying()) ? video()?.play() : video()?.pause()
}, 'video-controls')
```

```js
// /media-example.js
import './video-controls.js'

export const video = $(null)
export const timestamp = $(0)

$(ref => {
  ref.html`
    <video src="/assets/video.mp4" type="video/mp4"></video>
    <video-controls></video-controls>
  `

  ref.enter = () => {
    video(ref.querySelector('video'))
    video().ontimeupdate = () => timestamp(video().currentTime || 0)
  }
}, 'media-example')
```

`$(() => ref.html...)`: Binds time text and button labels directly to the template, updating UI without re-rendering or flickering the video element.

`ref.onclick`: Toggles `isPlaying` state and calls standard browser methods (`play()` and `pause()`) directly on the shared video element.

`export const video = $(null)`: Stores live DOM element references inside exported signals, allowing other files to control playback directly.

`ref.enter = () => { ... }`: Captures the `<video>` element only after it attaches to the DOM, preventing setup-time updates that would interrupt video rendering.

`video().ontimeupdate`: Listens to native browser playback events and updates the timestamp signal continuously as the video plays.


⚠️ Always capture DOM elements and assign them to signals inside `ref.enter`. Updating a signal directly in the main component body triggers an immediate re-render before mounting finishes, creating an infinite loop that repeatedly destroys and recreates the video node.