export const showMainNavigation = $(false)

$(ref => {
  ref.html`
    <style>
      main-navigation-button {
        z-index: 100;
        display: block;
        @media (min-width: 960px) { display: none; }
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translate(-50%, -20px);
        transition: 0.4s filter;
        border-radius: var(--size-1);
        backdrop-filter: blur(3px);
        filter: grayscale(1);
        & button {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          outline: none;
          display: grid;
          place-content: center;
          padding: var(--size-4);
          border-radius: var(--size-1);
          background: radial-gradient(circle, var(--color-edge) 0%, transparent 100%);
          & img { width: var(--size-3); }
        }
      }
    </style>
    <button aria-label="Main Navigation Button"><img alt="Main Navigation Button" src="/assets/favicon.svg"></button>
  `

  ref.onclick = () => {
    showMainNavigation(!showMainNavigation())
    ref.style.filter = showMainNavigation() ? `grayscale(0)` : `grayscale(1)`
  }
  
}, 'main-navigation-button')