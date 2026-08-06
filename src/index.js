import markdownParser from '/markdown-parser.js'
import '/ui/prevnext-navigation.js'
import '/ui/main-navigation-button.js'

export const links = [
  { name: 'Full Code', link: '/docs/about/full-code' },
  { name: 'Intro', link: '/' },
  { name: 'Get Started', link: '/docs/about/get-started' },
  { name: 'Server-side', link: '/docs/back-end/server-side'},
  { name: 'Initialization', link: '/docs/back-end/initialization' },
  { name: 'Route', link: '/docs/back-end/route' },
  { name: 'Request', link: '/docs/back-end/request' },
  { name: 'Runtime', link: '/docs/back-end/runtime' },
  { name: 'Resource', link: '/docs/back-end/resource' },
  { name: 'Response', link: '/docs/back-end/response' },
  { name: 'Reload', link: '/docs/back-end/reload' },
  { name: 'Endpoints', link: '/docs/back-end/endpoints' },
  { name: 'Cache', link: '/docs/back-end/cache' },
  { name: 'Middleware', link: '/docs/back-end/middleware' },
  { name: 'DB Integration', link: '/docs/back-end/db-integration' },
  { name: 'Deployment', link: '/docs/back-end/deployment' },
  { name: 'Client-side', link: '/docs/front-end/client-side' },
  { name: 'Reifier', link: '/docs/front-end/reifier' },
  { name: 'Rendering', link: '/docs/front-end/rendering' },
  { name: 'Reactivity', link: '/docs/front-end/reactivity' },
  { name: 'Referencing', link: '/docs/front-end/referencing' },
  { name: 'Router', link: '/docs/front-end/router' },
  { name: 'Standalone', link: '/docs/front-end/standalone' },
  { name: 'Tutorial', link: '/docs/guide/tutorial' },
  { name: 'Shared data', link: '/docs/guide/shared-data' },
  { name: 'Sign Up', link: '/docs/guide/signup' },
  { name: 'Sign Off', link: '/docs/guide/signoff' },
  { name: 'Sign In', link: '/docs/guide/signin' },
  { name: 'Sign Out', link: '/docs/guide/signout' }
]

export const categories = [
  { name: 'Intro', link: '/', match: link => !link.includes('/back-end/') && !link.includes('/front-end/') && !link.includes('/guide/') },
  { name: 'Server-side', link: '/docs/back-end/server-side', match: link => link.includes('/back-end/') },
  { name: 'Client-side', link: '/docs/front-end/client-side', match: link => link.includes('/front-end/') },
  { name: 'Tutorial', link: '/docs/guide/tutorial', match: link => link.includes('/guide/') }
].map(category => ({...category, items: links.filter(link => category.match(link.link) && link.link !== category.link)}))

$(async ref => { 
  const response = await fetch(location.pathname !== '/' ? location.pathname + '.md' : '/docs/about/intro.md')
  const result = await response.text()

  ref.html`
    <style>
      main {
        margin: var(--size-1) 3vw;
        margin: var(--size-1) 3vmin;
        & img[alt="Sedativ Logo"],
        & picture:has(img[alt="Sedativ Logo"]) {
          display: flex;
          align-items: center;
          max-width: 100%; 
          height: 100vmax;
          max-height: 90vh;
          transform: translateY(calc(var(--size-5) * -1));
        }
      }
    </style>

    <main>
      ${response.headers.get('content-type') === 'text/markdown' ? markdownParser(result) : ''}
      <prevnext-navigation></prevnext-navigation>
    </main>
    <main-navigation-button></main-navigation-button>
  `
}, 'index-route')