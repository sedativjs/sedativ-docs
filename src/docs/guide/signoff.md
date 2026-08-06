## Sign Off

### Sign Off Component

```js
// /auth/signoff.js
import { user } from './user.js'

$(async () => {
  const email = $()
  const password = $()
  const message = $()

  const response = await fetch('/auth/signoff.mjs', { method: 'DELETE' })
  const result = await response.json()
  email(result?.email)
  password(result?.password)
  user(result?.user)
  message(result?.message)
  result?.redirect && await _(result?.redirect)
}, 'signoff-route')
```

`signoff.js`: Runs permanent account deletion automatically upon mounting to the DOM.

`$(async () => { ... }, 'signoff-route')`: Triggers sign-off immediately on component creation without requiring form input.

`fetch('/auth/signoff.mjs', { method: 'DELETE' })`: Sends an HTTP `DELETE` request to the signoff endpoint.

`user(result?.user)`: Clears user state signal values, resetting site navigation to guest view.

`_(result?.redirect)`: Directs the client router to navigate to the target route without refreshing the page.

### Sign Off Endpoint

```js
// /auth/signoff.mjs
$(async req => {
  if (req.method === 'DELETE') {
    const { sql } = req
    const token = req.cookies?.token
    token && await sql`DELETE FROM users WHERE token = ${token}`

    return new Response(
      JSON.stringify({ email: null, password: null, user: null, redirect: '/auth/signup' }),
      { 
        status: 303, 
        statusText: 'See Other', 
        headers: { 'content-type': 'application/json', 'set-cookie': `token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Strict` } 
      }
    )
  }
})
```

`signoff.mjs`: Handles account deletion requests by wiping user database records and clearing session cookies.

`token && ...`: Uses logical evaluation to execute database queries only if a token cookie exists.

`DELETE FROM users WHERE token = ${token}`: Deletes the user record matching the active token from the database.

`return new Response(...)`: Returns a `303 See Other` response and resets client user state properties to `null`.

`'set-cookie'`: Sets cookie expiration to a past Unix epoch timestamp (`Thu, 01 Jan 1970 00:00:00 GMT`) to clear the client session.