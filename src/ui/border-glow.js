$(ref => {
  ref.html`
    <style>
      border-glow {
        display: grid;
        position: relative;
        border-radius: var(--border-radius);
        background: var(--color-edge);
        &:hover::before,
        &:hover::after {
          opacity: 1;
        }
        &::before,
        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.5s;
        }
        &::before {
          z-index: 3;
          background: radial-gradient(100vmin circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.1) 0%, transparent 100%);
        }
        &::after {
          z-index: 1;
          background: radial-gradient(100vmin circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,1) 0%, transparent 50%);
        }
        & > content-glow {
          z-index: 2;
          background: var(--color-background);
          border-radius: inherit;
          margin: 1px;
        }
      }
    </style>
    
    <content-glow>${ref.innerHTML}</content-glow>
  `

  let endX, endY, startX, startY
  let ease = 0.1
  const lerp = (start, end, easing) => start * (1 - easing) + end * easing

  ref.onmousemove = event => {
    const { target } = event
    
    startX = parseFloat(target.style.getPropertyValue('--mouse-x')) || 0
    startY = parseFloat(target.style.getPropertyValue('--mouse-y')) || 0
    
    endX = event.clientX - target.getBoundingClientRect().left
    endY = event.clientY - target.getBoundingClientRect().top

    target.style.setProperty('--mouse-x', `${lerp(startX, endX, ease)}px`)
    target.style.setProperty('--mouse-y', `${lerp(startY, endY, ease)}px`)
  }
}, 'border-glow')

