$(ref => {
  ref.html`
    <style>
      copy-button {
        display: none;
      }
      @media (min-width: 960px) {
        copy-button {
          display: block;
          position: relative;
          & button {
            text-transform: uppercase;
            padding: var(--size-6);
            font-size: var(--size-5);
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
    <button data-tooltip="Copy" aria-label="Copy code to clipboard">❐</button>
  `

  ref.onclick = async ({ target }) => {
    // Make sure we target the button element if clicked directly
    const button = target.closest('button')
    const codeEl = ref.closest('code-block')?.querySelector('code')
    if (!codeEl || !button) return

    try {
      await navigator.clipboard.writeText(codeEl.innerText)
      button.innerText = '✔'
      button.setAttribute('data-tooltip', 'Copied!')

      setTimeout(() => {
        button.innerText = '❐'
        button.setAttribute('data-tooltip', 'Copy')
      }, 1200)
    } catch (err) {
      button.innerText = '✖'
      button.setAttribute('data-tooltip', 'Failed!')
    }
  }
}, 'copy-button')