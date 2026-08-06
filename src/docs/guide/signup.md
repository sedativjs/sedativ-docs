## Sign Up

### Sign Up Component

```js
// /auth/signup.js
import { user } from './user.js'

$(ref => {
  const email = $()
  const password = $()
  const message = $()

  $(() => ref.html`
    <form name="signupForm">
      <input type="email" name="email" placeholder="email" value="${email() || ''}">
      <input type="password" name="password" placeholder="password" value="${password() || ''}">
      <button>Sign up</button>
      <div class="message">${message() || ''}</div>
    </form>
  `)

  ref.onsubmit = async event => {
    event.preventDefault()
    const response = await fetch('/auth/signup.mjs', {
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
}, 'signup-route')
```

`signup.js`: Renders the user registration form and posts input data to the signup endpoint.

`const email = $(), const password = $(), const message = $()`: Initializes local signals to track input values and message feedback inside the component instance.

`$(() => ref.html...)`: Wraps rendering in a reactive effect to re-render DOM nodes whenever local signals update.

`event.preventDefault()`: Prevents standard form submissions to handle data transfers via fetch.

`fetch('/auth/signup.mjs', { method: 'POST', ... })`: Sends an HTTP `POST` request along with user credentials to the signup endpoint.

`user(result?.user)`: Updates global user state with authenticated user data returned from the server.

`_(result?.redirect)`: Directs the client router to navigate to the target route without refreshing the page.

⚠️ Router endpoints require explicit file extensions (like `.mjs`). Omitting extensions causes the server to resolve paths as static HTML files instead.

### Sign Up Endpoint

```js
// /auth/signup.mjs
import { hash } from './pbkdf2.mjs'

$(async req => {
  if (req.method === 'POST') {
    const { email, password } = req.body
    const { sql } = req

    if (!email || !password) return new Response(
      JSON.stringify({ email, password, message: 'Please enter email and password' }),
      { status: 400, statusText: 'Bad Request', headers: { 'content-type': 'application/json' } }
    )

    const [existingUser] = await sql`SELECT * FROM users WHERE email = ${email}`
    if (existingUser) return new Response(
      JSON.stringify({ email, password, message: 'Creating account failed' }),
      { status: 409, statusText: 'Conflict', headers: { 'content-type': 'application/json' } }
    )

    const id_user = crypto.randomUUID()
    const token = `${await hash(email)}$${await hash(password)}`

    const [user] = await sql`INSERT INTO users (id_user, email, token) VALUES (${id_user}, ${email}, ${token}) RETURNING *`
    if (!user) return new Response(
      JSON.stringify({ email, password, message: 'Creating account failed' }),
      { status: 409, statusText: 'Conflict', headers: { 'content-type': 'application/json' } }
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

`signup.mjs`: Handles registration requests, saves user credentials, and sets browser session cookies.

`if (!email || !password)`: Returns a `400 Bad Request` response if input credentials are missing.

`SELECT * FROM users WHERE email = ${email}`: Queries SQLite for existing records matching the provided email address.

`if (existingUser)`: Returns a generic `409 Conflict` response if the email address is already registered.

`crypto.randomUUID()`: Generates a unique v4 UUID string to serve as the user's primary database key.

`${await hash(email)}$${await hash(password)}`: Constructs a compound token string combining hashed email and hashed password joined by $.

`INSERT INTO users (id_user, email, token) ...`: Writes new user details into the database.

`RETURNING *`: Returns the newly inserted database row directly to the request handler context.

`if (!user)`: Returns a `409 Conflict` response if the database insert operation fails to return a record.

`return new Response(...)`: Returns a `200 OK` response containing user data and navigation instructions.

`'set-cookie'`: Sets an HTTP-only, secure session cookie header upon successful authentication.