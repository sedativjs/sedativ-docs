## Deployment

Sedativ runs on any infrastructure that supports the Deno runtime. For simplicity, this guide uses **Deno Deploy**, which provides zero-configuration edge hosting.

- **Static Assets and Code**: System files (such as `main.mjs`, `middleware.mjs`, client scripts) are baked directly into the deployment bundle and distributed globally across edge data centers.

- **Database State and Local File System**: The local file system should generally not be relied upon for persistent data storage in serverless deployment environments. Because edge nodes are ephemeral and do not share a single physical drive, embedded local database files (such as `db.sqlite`) may be reset or lost when instances spin down or restart. For reliable data persistence, production environments typically require an external cloud database or a distributed storage layer.

### Push Code to GitHub

- Update `db.mjs` to use `npm:postgres` before pushing your changes if you are using a local SQLite database.

- Ensure the project is tracked by Git and pushed to a remote repository on **GitHub**.

- Log in to the dashboard at **Deno Deploy**.

### Link the Project

- Navigate to the **App** tab.

- Click **New app**.

- Select the GitHub profile or organization, then choose the repository.

- Click **Edit app config**.

- Change the **Entrypoint** setting to point directly to **main.mjs**.

- Close the configuration modal and click **Create App**.

The platform immediately generates a global, production-ready URL with automated SSL certificate validation.

### Provision Database

- Navigate to the **Databases** tab.

- Click **Provision Database**.

- Select **Prisma Postgres**.

- Name the database instance and select the geographic region closest to the application's users to minimize network latency.

- Click **Provision**.

- Click **Assign**.

- Select your app.

- Click **Attach Database**.

Once provisioned, Deno Deploy automatically injects the credentials (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`) directly into the live environment variables. When the application starts, the `postgres()` database client reads these keys automatically to secure the network connection.