$(ref => {
  ref.html`
    <style>
      slider-horizontal {
        display: block;
        border-radius: var(--border-radius);
        border: 1px solid var(--color-edge);
        margin: var(--size-3) 0;
        transition: border 0.5s;
        overflow: hidden;
        overscroll-behavior-y: auto;
        touch-action: pan-y;

        &:hover { 
          border-color: var(--color-gray); 
        }
        &.dragging { 
          user-select: none; cursor: grabbing; 
        }

        & > slider-track {
          padding: calc(var(--size-6) * 2);
          display: block;
          width: max-content;
        }
      }
    </style>
    <slider-track>${ref.innerHTML}</slider-track>
  `

  let start = 0, prev = 0, curr = 0, bounds = 0, track = null

  ref.onpointerdown = event => {
    if (!(track = ref.querySelector('slider-track'))) return
    bounds = Math.min(0, ref.clientWidth - track.scrollWidth)
    if (bounds) start = event.clientX
  }

  ref.onpointermove = event => {
    if (!start) return
    const dx = event.clientX - start

    if (!ref.classList.contains('dragging')) {
      if (Math.abs(dx) < 5 || window.getSelection()?.toString()) return
      ref.classList.add('dragging')
      ref.setPointerCapture(event.pointerId)
    }

    window.getSelection()?.removeAllRanges()
    curr = Math.max(bounds, Math.min(0, prev + dx))
    track.style.transform = `translateX(${curr}px)`
  }

  ref.onpointerup = ref.onpointercancel = event => {
    if (!start) return
    prev = curr
    start = 0
    ref.classList.remove('dragging')
    if (event.pointerId && ref.hasPointerCapture(event.pointerId)) ref.releasePointerCapture(event.pointerId)
  }
}, 'slider-horizontal')