## Rendering

```js
$(ref => html``, 'component-name')
```

Components are real `HTMLElement` instances. Layout updates use the browser's native HTML parser directly, requiring no custom compilers, build steps, or (JSX) transformations.

### Templates

```js
// /template-example.js
import './hello-world.js'

$(ref => {
  ref.html`
    <h1>Component:</h1>
    <hello-world></hello-world>
  `
}, 'template-example')
```

`ref.html`: Tagged template literal method attached to the component instance. It parses template strings into live DOM fragments using `range.createContextualFragment()` and updates the layout via `replaceChildren()`.

- **Hyphenated Tags** (`<hello-world>`): Tag names must be lowercase and contain at least one hyphen. This is a strict Web Components specification requirement to avoid collisions with standard HTML tags.

- **Explicit Closing Tags** (`</hello-world>`): Custom elements do not support self-closing syntax in standard HTML parsing. Opening and closing tags must always be explicitly declared.

### Styles

```js
// /styles-example.js
$(ref => {
  const isActive = true
  const activeColor = 'blue'

  ref.html`
    <style>
      styles-example .title { color: orange; }
      styles-example .active { font-weight: bold; }
    </style>

    <h1 class="title">I have class</h1>
    <button style="font-size: 3rem;">I have style</button>
    <div
      class="${isActive ? 'active' : ''}"
      style="background-color: ${activeColor}"
    >I have dynamic class and style</div>
  `
}, 'styles-example')
```

`styles-example .title`: Scopes CSS rules to specific element tag. Custom elements act as natural scope boundaries in standard CSS, preventing styles from leaking to other parts of the page.

`${isActive ? 'active' : ''}`: Injects standard JavaScript expressions into class or style attributes to update element appearances based on state changes.

### Conditionals

```js
// /conditionals-example.js
$(ref => {
  const color = 'red'

  ref.html`
    ${color === 'green' ? '<p>Green</p>' : ''}
    ${color === 'blue' ? '<p>Blue</p>' : ''}
    <p>${color === 'cyan' ? 'Cyan' : color === 'magenta' ? 'Magenta' : 'Maybe red'}</p>
  `
}, 'conditionals-example')
```

`${color === 'green' ? ... : ''}`: Evaluates standard JavaScript ternary operations inside template strings to conditionally render or hide HTML blocks. No framework-specific directives (like v-if or *ngIf) are needed.

### Loops

```js
// /loops-example.js
$(ref => {
  const colorsRGB = ['red', 'green', 'blue']

  ref.html`
    <ul>
      ${colorsRGB.map((color) => `
        <li>${color}</li>
      `).join('')}
    </ul>
  `
}, 'loops-example')
```

`colorsRGB.map(...)`: Iterates over an array and maps each item to an HTML template string.

`.join('')`: Combines the array of HTML strings into a single string. This removes the commas that JavaScript automatically inserts when converting arrays to text.

### Events

```js
// /events-example.js
$(ref => {
  ref.html`
    <style>
      .mouse-tracker { width: 100px; height: 100px; background-color: orangered; }
    </style>
    <button>Click!</button>
    <div class="mouse-tracker"></div>
  `

  ref.onclick = event => {
    if (event.target.tagName === 'BUTTON') alert('Clicked!')
  }

  ref.onmousemove = event => {
    if (event.target.classList.contains('mouse-tracker')) {
      console.log(`Mouse: X=${event.clientX}, Y=${event.clientY}`)
    }
  }
}, 'events-example')
```

`ref.onclick`: Attaches event handlers directly to the custom component's element instead of binding separate listeners to every individual child node.

`event.target`: Uses native event delegation. Because DOM events naturally bubble up to the component root, checking `event.target` lets you capture and handle interactions efficiently.

### Nodes

```js
// /nodes-example.js
$(ref => {
  ref.html`
    <button>Log DOM Node</button>
  `

  const buttonRef = ref.querySelector('button')
  ref.onclick = () => console.log(buttonRef)
}, 'nodes-example')
```

`ref.querySelector('button')`: Queries elements inside the component's subtree. Because the search is scoped directly to `ref`, global IDs or special framework refs is not needed to access child DOM nodes.