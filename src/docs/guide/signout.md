## Sign Out

### Sign Out Component

```js
// /auth/signout.js
import { user } from './user.js'

$(async () => {
  const email = $()
  const password = $()
  const message = $()

  const response = await fetch('/auth/signout.mjs', { method: 'DELETE' })
  const result = await response.json()
  email(result?.email)
  password(result?.password)
  user(result?.user)
  message(result?.message)
  result?.redirect && await _(result?.redirect)
}, 'signout-route')
```

`signout.js`: Runs session signout routines immediately upon mounting to the DOM.

`$(async () => { ... }, 'signout-route')`: Triggers signout immediately on component creation without requiring form input.

`fetch('/auth/signout.mjs', { method: 'DELETE' })`: Sends an HTTP `DELETE` request to the signout endpoint.

`user(result?.user)`: Clears user state signal values, resetting site navigation to guest view.

`_(result?.redirect)`: Directs the client router to navigate to the target route without refreshing the page.

### Sign Out Endpoint

```js
// /auth/signout.mjs
$(req => {
  if (req.method === 'DELETE') {
    return new Response(
      JSON.stringify({ email: null, password: null, user: null, redirect: '/auth/signin' }),
      { 
        status: 303, 
        statusText: 'See Other', 
        headers: { 'content-type': 'application/json', 'set-cookie': `token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Strict` } 
      }
    )
  }
})
```

`signout.mjs`: Handles user logouts by clearing client browser cookies without executing database operations.

`return new Response(...)`: Returns a `303 See Other` response resetting user context values to `null`.

`'set-cookie'`: Sets cookie expiration to a past Unix epoch timestamp (`Thu, 01 Jan 1970 00:00:00 GMT`) to clear the client session.