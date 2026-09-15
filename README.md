# findatime-ui

Frontend for the Findatime event-scheduling product (see `findatime-api`).

## Prerequisites

The `@arompr/findatime-typescript-client` dependency is hosted as a private
package on GitHub Packages. To install it you need a GitHub token.

1. Create a GitHub personal access token with the `read:packages` scope.
2. Add it to your **user-level** npm config (`~/.npmrc`, *not* the repo):

   ```bash
   echo '//npm.pkg.github.com/:_authToken=YOUR_TOKEN' >> ~/.npmrc
   ```

This keeps the token out of the repository and the container image. The project
`.npmrc` only sets the registry (`@arompr:registry=https://npm.pkg.github.com`).

## Development

```bash
npm install
npm run dev          # dev server on :5173
```

## Production container

```bash
make container       # build the Podman image (mounts ~/.npmrc as a secret)
make container-dev   # run the image at http://localhost:8080
```

The image is a multi-stage build: a Node stage builds the static bundle, which
is then served by nginx (`nginx.conf` provides the SPA fallback). API calls are
made by the browser against `VITE_API_URL` (default `http://localhost:5263`), so
the container itself does not need host networking.
