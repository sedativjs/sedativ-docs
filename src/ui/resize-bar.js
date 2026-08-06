$(ref => {
  ref.html`
    <style>
      resize-bar {
        cursor: col-resize; 
        user-select: none;
        z-index: 1000;
        background: var(--color-background);
        transform: translateX(-9.6px)
      }
    </style>
  `
}, 'resize-bar')