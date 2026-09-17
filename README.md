# findatime-ui

Frontend for the Findatime event-scheduling product (see `findatime-api`).

## Prerequisites

The `@arompr/findatime-typescript-client` dependency is hosted as a private
package on GitHub Packages. To install it locally you need a GitHub token.

1. Create a GitHub personal access token with the `read:packages` scope.
2. Add it to your **user-level** npm config (`~/.npmrc`, *not* the repo):

   ```bash
   echo '//npm.pkg.github.com/:_authToken=YOUR_TOKEN' >> ~/.npmrc
   ```

This keeps the token out of the repository. The project `.npmrc` only sets the
registry (`@arompr:registry=https://npm.pkg.github.com`).

## Development

```bash
npm install
npm run dev          # dev server on :5173
```

## Deployment (Render Static Site)

The app is deployed as a [Render Static Site](https://docs.render.com/static-sites).
Render runs the build command defined in `render.yaml` on every push to the
configured branch and serves the contents of `dist/`.

### Required environment variables on the Render service

| Key | Purpose |
|---|---|
| `VITE_API_URL` | Public URL of the `findatime-api` for this environment. Baked into the JS bundle at build time. |
| `GITHUB_TOKEN` | GitHub PAT with `read:packages` scope. Used by `npm ci` to fetch the private `@arompr/findatime-typescript-client`. Set with `sync: false` in the Blueprint (already done) so it isn't echoed. |

### How the token reaches `npm ci`

The `buildCommand` in `render.yaml` generates a project `.npmrc` at build time
that references the `GITHUB_TOKEN` env var using npm's `${VAR}` substitution.
The literal token never enters the repo, the build log, or the published
`dist/`. Local development is unaffected: continue using your user-level
`~/.npmrc`.

### Setting up the service

1. Push this repo to GitHub.
2. In the Render Dashboard, click **New > Blueprint**, point it at this repo.
   Render reads `render.yaml` and creates the `findatime-ui-staging` service.
3. Open the service's **Environment** page and set `VITE_API_URL` to your
   staging API URL. (`GITHUB_TOKEN` is declared with `sync: false` in the
   Blueprint — Render will prompt you for it during creation.)
4. The first deploy triggers automatically. Subsequent deploys fire on every
   push to the `branch` configured in `render.yaml` (default: `main`).

### SPA routing

`render.yaml` includes a catch-all rewrite (`/*` -> `/index.html`) so client-side
routes resolve correctly on hard reload / direct URL load.

### Branching and environments

This blueprint deploys a single staging service from `main`. For a separate
production environment, add a second service entry in `render.yaml` with a
different `branch` and `VITE_API_URL`.
