## Sign In

### Sign In Component

```js
// /auth/signin.js
import { user } from './user.js'

$(ref => {
  const email = $()
  const password = $()
  const message = $()

  $(() => ref.html`
    <form name="signinForm">
      <input type="email" name="email" placeholder="email" value="${email() || ''}">
      <input type="password" name="password" placeholder="password" value="${password() || ''}">
      <button>Sign in</button>
      <div class="message">${message() || ''}</div>
    </form>
  `)

  ref.onsubmit = async event => {
    event.preventDefault()
    const response = await fetch('/auth/signin.mjs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: event.target.elements['email'].value ?? '',
        password: event.target.elements['password'].value ?? ''
      })
    })
    const result = await response.json()
    email(result?.email)
    password(result?.password)
    user(result?.user)
    message(result?.message)
    result?.redirect && await _(result?.redirect)
  }
}, 'signin-route')
```

`signin.js`: Renders the login form, captures user inputs, and submits credentials to the signin endpoint.

`const email = $(), const password = $(), const message = $()`: Initializes local signals to track input values and message feedback inside the component instance.

`$(() => ref.html...)`: Wraps rendering in a reactive effect to re-render DOM nodes whenever local signals update.

`event.preventDefault()`: Prevents standard form submissions to handle data transfers via fetch.

`fetch('/auth/signin.mjs', { method: 'POST', ... })`: Sends an HTTP `POST` request along with user credentials to the signin endpoint.

`user(result?.user)`: Updates global user state with authenticated user data returned from the server.

`_(result?.redirect)`: Directs the client router to navigate to the target route without refreshing the page.

### Sign In Endpoint

```js
// /auth/signin.mjs
import { verify } from './pbkdf2.mjs'

$(async req => {
  if (req.method === 'POST') {
    const { email, password } = req.body
    const { sql } = req

    if (!email || !password) return new Response(
      JSON.stringify({ email, password, message: 'Please enter email and password' }),
      { status: 400, statusText: 'Bad Request', headers: { 'content-type': 'application/json' } }
    )

    const [ user ] = await sql`SELECT * FROM users WHERE email = ${email}`
    if (!user) return new Response(
      JSON.stringify({ email, password, message: 'Incorrect credentials' }),
      { status: 401, statusText: 'Unauthorized', headers: { 'content-type': 'application/json' } }
    )

    const token = user.token
    const passwordToken = user.token.split('$')[1]

    const passwordVerified = await verify(password, passwordToken)
    if (!passwordVerified) return new Response(
      JSON.stringify({ email, password, message: 'Incorrect credentials' }),
      { status: 401, statusText: 'Unauthorized', headers: { 'content-type': 'application/json' } }
    )

    return new Response(
      JSON.stringify({ email, password, user, redirect: '/auth/user' }),
      { 
        status: 200, 
        statusText: 'OK', 
        headers: { 'content-type': 'application/json', 'set-cookie': `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict` } 
      }
    )
  }
})
```

`signin.mjs`: Handles verification of user credentials against SQLite records and issues authentication session cookies.

`if (!email || !password)`: Returns a `400 Bad Request` response if input credential fields are missing.

`SELECT * FROM users WHERE email = ${email}`: Queries the database for user accounts matching the email input.

`if (!user)`: Returns a `401 Unauthorized` response if no matching user record is found.

`user.token.split('$')[1]`: Extracts the password hash segment from the stored compound token string.

`await verify(password, passwordToken)`: Hashes the incoming plain-text password and compares it against the extracted token hash.

`if (!passwordVerified)`: Returns a `401 Unauthorized` response if password verification fails.

`return new Response(...)`: Returns a `200 OK` response with user data payload and redirect target.

`'set-cookie'`: Sets an HTTP-only, secure session cookie header upon successful authentication.