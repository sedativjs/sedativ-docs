import '/ui/copy-button.js'
import '/ui/download-button.js'
import '/ui/slider-horizontal.js'

$(ref => {
  ref.html`
    <style>
      code-block {
        display: block;
        margin: var(--size-3) 0;
        position: relative;
        & code-block-buttons {
          display: flex;
          align-items: center;
          position: absolute;
          right: 0;
          top: 0;
        }
      }
    </style>
    <code-block-buttons>
      <copy-button></copy-button>
      <download-button></download-button>
    </code-block-buttons>
    <slider-horizontal>
      ${ref.innerHTML.trim()}
    </slider-horizontal>
  `
}, 'code-block')