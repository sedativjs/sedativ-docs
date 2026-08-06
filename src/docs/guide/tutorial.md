# Tutorial

This guide walks through building a simple user authentication system from scratch. Below is a general overview of the architecture:

<img src="/assets/mermaid-diagram-tutorial.svg" alt="Tutorial diagram" style="width: 100%; max-height: 100vh; margin: var(--size-1) 0">

The system manages user logins using signed browser cookies without needing a server session table. Client components link directly to server endpoints through reactive signals.

- **Compound Session Tokens**: Joins user identity and hashed credentials into a single string using a $ delimiter. This string works as both the database lookup key and the browser cookie.

- **Uniform Responses**: Protects against user enumeration by returning identical error messages and equal response times regardless of whether an email exists or a password fails.

- **Session Eviction**: Logging out clears the client cookie immediately in memory without querying the database.

By the end of this tutorial, your project structure can look like this:

```
db.mjs
main.mjs
middleware.mjs
src/
├─ index.html
├─ main-layout.js
└─ auth/
  ├─ pbkdf2.mjs
  ├─ signin.js
  ├─ signin.mjs
  ├─ signoff.js
  ├─ signoff.mjs
  ├─ signout.js
  ├─ signout.mjs
  ├─ signup.js
  ├─ signup.mjs
  └─ user.js
```

You can create empty files now and populate them as we step through the guide.