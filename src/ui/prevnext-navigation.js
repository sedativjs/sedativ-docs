import { links } from '/index.js'
import '/ui/border-glow.js'

$(ref => {
  const idx = links.findIndex(route => route.link === location.pathname)
  const empty = { link: '', name: '' }
  const prev = $(idx > 0 ? links[idx - 1] : empty)
  const next = $(idx >= 0 && idx < links.length - 1 ? links[idx + 1] : empty)

  ref.html`
    <style>
      prevnext-navigation {
        display: grid;
        grid-template-columns: 1fr;
        @media (min-width: 960px) { grid-template-columns: 1fr 1fr; }
        margin: var(--size-1) 0 calc(var(--size-1) * 2) 0;
        @media (min-width: 960px) { margin: var(--size-1) 0; };

        gap: var(--size-5);
        & a {
          text-align: center;
          color: var(--color-gray);
          font-weight: var(--font-bold);
          transition: color 0.4s;
          &:hover { 
            color: var(--color-foreground); 
          }
          & content-glow { 
            padding: var(--size-4);
            & small {
              display: block;
              color: var(--color-gray); 
              font-weight: var(--font-light); 
            }
          }
        }
      }
    </style>
    ${prev().link ? `<a href='${prev().link}'><border-glow><small>◀ Prev</small>${prev().name}</border-glow></a>` : ''}
    ${next().link ? `<a href='${next().link}'><border-glow><small>Next ▶</small>${next().name}</border-glow></a>` : ''}
  `
}, 'prevnext-navigation')