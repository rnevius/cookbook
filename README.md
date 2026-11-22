# Cookbook

A Modernist Cuisine inspired personal recipe notebook.

## Run

```sh
mise install
mise exec -- npm ci
mise exec -- npm run dev
```

Open http://127.0.0.1:3000. The SQLite database is created and migrated automatically.

Copy `.env.example` to `.env` to change settings. Optionally run `npm run db:seed` to add an example recipe.

## Development

```sh
npm run format       # Format files
npm run check        # Check formatting and run unit/integration tests
npm run test:setup   # Install Chromium once
npm run test:e2e     # Run browser tests
```

Tests use isolated databases. Refresh the browser after front-end edits.

## Data

To back up or restore, stop the server, copy or replace `data/recipes.sqlite`, then restart.

Add schema changes as new SQL files in `migrations/`; never edit applied migrations. Back up before schema changes. Migrations run at startup or with `npm run db:migrate`.

## Deployment

1. Point DNS at the server.
2. Add the [Caddy site block](deploy/Caddyfile.example) to the server's Caddyfile, validate it, and reload Caddy. HTTPS Basic Auth must be working before the first deploy.
3. Copy [`.env.deploy.example`](.env.deploy.example) to `.env.deploy` and set the SSH host and HTTPS URL.

```sh
mise exec -- npm run deploy:setup  # First deploy or service changes, via root SSH
mise exec -- npm run deploy        # Later deploys, via cookbook-deploy SSH
```

After setup, authorize your SSH public key for `cookbook-deploy` before running later deploys.
