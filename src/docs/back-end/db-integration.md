## DB Integration

```js
// db.mjs
export default req => req.sql = ...
```

Sedativ is database-agnostic, giving freedom to use any any database engine, driver, or ORM.

`db.mjs`: Executes database initialization logic before middleware and attaches query utilities directly to the request object `req`.

### SQLite

```js
// db.mjs
import { DatabaseSync } from 'node:sqlite'

const database = new DatabaseSync('db.sqlite')

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id_user TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    token TEXT NOT NULL
  )
`)

export default req => req.sql = async (strings, ...values) => 
  database.prepare(strings.reduce((acc, str, i) => 
    acc + str + (i < values.length ? '?' : ''), '')).all(...values)
```

`node:sqlite`: Imports Node's native SQLite driver to manage local databases with zero external dependencies. This might be useful for rapid local development.

`DatabaseSync('db.sqlite')`: Opens or creates a local SQLite database file named `db.sqlite`.

`database.exec(...)`: Executes initial SQL commands to ensure required tables exist when the server starts.

`req.sql`: Attaches a custom query function to the request object, making database operations accessible across endpoints.

`strings.reduce(...)`: Converts tagged template literals into parameterized SQL queries with `?` placeholders to prevent SQL injection vulnerabilities.

`database.prepare(...).all(...)`: Compiles prepared statements and executes them with passed arguments, returning matching database rows as an array.

```js
// /endpoint.mjs
$(async (req) => {
  const { sql } = req

  const users = await sql`SELECT * FROM users WHERE email = ${req.query?.email}`

  return new Response(
    JSON.stringify(users),
    { headers: { 'content-type': 'application/json' } }
  )
})
```

`const { sql } = req`: Extracts the query utility attached during request processing.

`await sql`: Executes the parameterized query asynchronously, safely escaping embedded values before returning results.

`SELECT * FROM users WHERE email = ${req.query?.email}`: Queries the `users` table using URL query parameters. Values inside tagged template placeholders are extracted and parameterized automatically.

### Postgres

```js
// db.mjs
import postgres from 'npm:postgres'

const sql = postgres(Deno.env.get('DATABASE_URL'))

await sql`
  CREATE TABLE IF NOT EXISTS users (
    id_user TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    token TEXT NOT NULL
  )
`

export default req => req.sql = sql
```

`npm:postgres`: Imports the PostgreSQL driver to connect to production databases over the network.

`postgres(Deno.env.get('DATABASE_URL'))`: Initializes a database connection pool using the DATABASE_URL environment variable used by some cloud platforms, and falls back to standard individual environment variables if it is not found.

`await sql`: Executes table setup using top-level `await` during server initialization.

`export default req => req.sql = sql`: Attaches the native PostgreSQL query function directly to `req.sql`.

```js
// /endpoint.mjs
$(async (req) => {
  const { sql } = req

  const users = await sql`SELECT * FROM users WHERE email = ${req.query?.email}`

  return new Response(
    JSON.stringify(users),
    { headers: { 'content-type': 'application/json' } }
  )
})
```

While local SQLite storage might be wiped on serverless hosting platforms, migrating to persistent cloud PostgreSQL requires no endpoint modifications in this setup, because the PostgreSQL driver processes tagged template literals similarly to the custom SQLite wrapper defined earlier.