import '/ui/main-navigation.js'
import '/ui/resize-bar.js'

$(ref => {
  ref.html`
    <style>
      main-layout { 
        height: 100vh;
        height: 100dvh;
        width: 100%; 
        display: grid;
        @media (min-width: 960px) { grid-template-columns: var(--nav-width, 320px) 10px 1fr; }
        @media (min-width: 2560px) { grid-template-columns: var(--nav-width, 640px) 10px 1fr; }
        &.dragging { cursor: col-resize; }
        & > main-navigation { overflow-y: auto; }
        & > client-router { overflow-y: auto; }
      }
    </style>

    <main-navigation></main-navigation>
    <resize-bar></resize-bar>
    <client-router></client-router>
  `

  let offset = $(null)

  ref.onpointerdown = ({ target, pointerId }) => {
    if (!target.closest('resize-bar')) return
    ref.setPointerCapture(pointerId)
    offset(ref.getBoundingClientRect().left)
    ref.classList.add('dragging')
  }

  ref.onpointermove = ({ clientX }) => {
    if (offset() === null) return
    ref.style.setProperty('--nav-width', `${Math.max(0, Math.min(ref.clientWidth, clientX - offset()))}px`)
  }

  ref.onpointerup = ref.onpointercancel = () => {
    offset(null)
    ref.classList.remove('dragging')
  }
}, 'main-layout')