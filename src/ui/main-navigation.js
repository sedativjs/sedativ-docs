import { categories } from '/index.js'
import { showMainNavigation } from '/ui/main-navigation-button.js'

$(ref => {

  ref.html`
    <style>
      main-navigation {
        width: 100%;
        height: 100vh;
        height: 100dvh;
        display: none;
        display: ${showMainNavigation() ? 'grid' : 'none' };
        @media (min-width: 960px) { display: grid; }
        & nav {
          margin: var(--size-1) 3vw;
          margin: var(--size-1) 3vmin;
          & p {
            &:first-child {
              margin: 0;
            }
            margin: var(--size-2) 0 var(--size-5) 0;
            & a {
              text-transform: uppercase;
              font-weight: var(--font-bold);
              font-size: var(--size-5); 
              transition: color 0.4s;
              &:hover { color: var(--color-foreground); }
            }
          }
          & li {
            list-style: none;
            margin-left: 0;
            & a {
              text-transform: uppercase;
              font-weight: var(--font-bold);
              font-size: var(--size-6); 
              transition: color 0.4s;
              &:hover { color: var(--color-foreground); }
            }
          }
        }
      }
    </style>

    <nav>
      ${categories.map(cat => `
        <p><a href="${cat.link}">${cat.name}:</a></p>
        <ul>
          ${cat.items.map(item => `<li><a href="${item.link}">${item.name}</a></li>`).join('')}
        </ul>
      `).join('')}
    </nav>
  `

  ref.onclick = event => showMainNavigation(!showMainNavigation())
}, 'main-navigation')