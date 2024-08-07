# mypt

## Get started

- Install [nvm](https://github.com/nvm-sh/nvm) or [nodenv](https://github.com/nodenv/nodenv)
- Install php for dev server (macos: brew install php)
- `nvm use` or `nodenv install`
- `npm install`

## Develop

`npm run dev` starts a web server in watch mode on [http://localhost:8080](http://localhost:8080).

Need to re-run build to see updates. For rapid iterating on styles, use https://play.tailwindcss.com

## Build

`npm run build`

## Previews

All PRs pushed to GitHub will generate a preview URL on Firebase that you can use to view changes before merging.

## Deploy

### Standard production deploys

By default all merges to `main` will deploy to production via GitHub Actions, so you should never need to manually deploy.

### Manual production deploys

If you need to deploy manually, you can:

- `firebase login`
- `npm run deploy`
