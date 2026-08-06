$(ref => {
  ref.html`
    <style>
      download-button {
        display: none;
      }
      @media (min-width: 960px) {
        download-button {
          display: block;
          position: relative;
          & button {
            text-transform: uppercase;
            padding: var(--size-6);
            font-size: var(--size-4);
            border: none;
            border-radius: var(--border-radius);
            background: transparent;
            color: var(--color-edge);
            transition: color 0.2s;

            &:hover {
              color: var(--color-foreground);
            }

            &::after {
              content: attr(data-tooltip);
              position: absolute;
              right: calc(100% + 1rem);
              top: 50%;
              transform: translateY(-50%);
              font-size: var(--size-6);
              text-transfrm: uppercase;
              white-space: nowrap;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.15s ease-in-out;
            }

            &:hover::after,
            &:focus-visible::after {
              opacity: 1;
            }
          }
        }
      }
    </style>
    <button data-tooltip="Download" aria-label="Download code snippet">⭳</button>
  `

  ref.onclick = async ({ target }) => {
    const button = target.closest('button')
    const codeBlock = ref.closest('code-block')
    const codeEl = codeBlock?.querySelector('code')
    if (!codeEl || !button) return

    try {
      const blob = new Blob([codeEl.innerText], { type: 'text/javascript;charset=utf-8' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `sedativ-code-example.js`
      a.click()
      URL.revokeObjectURL(url)

      button.innerText = '✔'
      button.setAttribute('data-tooltip', 'Downloaded!')

      setTimeout(() => {
        button.innerText = '⭳'
        button.setAttribute('data-tooltip', 'Download')
      }, 1200)
    } catch (err) {
      button.innerText = '✖'
      button.setAttribute('data-tooltip', 'Failed!')
    }
  }
}, 'download-button')