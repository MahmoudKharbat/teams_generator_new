# Zemer Teams Generator

Splits the players who showed up into two fair teams. Live at
https://mahmoudkharbat.github.io/teams_generator_new/

- **Team generator** (`/`): pick players, then **Balanced** (the fairest split) or **Shuffle** (a random
  split close to the fairest). Share the result as text or as an image without power ratings.
- **Admin console** (`/#/admin`): add, edit and delete players and their power (0–100).

Players are stored in Firestore (`new_players`). The balancing algorithm is in
`src/lib/teamBalancer.js`.

## Development

```sh
npm install
npm run dev     # local dev server
npm run lint
npm run build
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: lint, build, and publish `dist/` to the
`gh-pages` branch, which GitHub Pages serves. If lint or the build fails, nothing is published and
the live version stays. Run it by hand from the repo's **Actions** tab → **Deploy to GitHub Pages** →
**Run workflow**. `npm run deploy` still publishes from your machine (without a version bump).

### Versions

Each push to `main` gets the next version automatically ([semantic versioning](https://semver.org)),
chosen from the commit messages since the last `v*` tag:

| Commit message | Example | Version |
| --- | --- | --- |
| `feat: …` | `feat: copy teams as text` | minor, 1.2.0 → 1.3.0 |
| `fix: …` or no prefix | `fix: image text offset` | patch, 1.2.0 → 1.2.1 |
| `feat!: …` / `BREAKING CHANGE:` in the body | `feat!: new player data model` | major, 1.2.0 → 2.0.0 |
| only `docs:` `chore:` `ci:` `style:` `test:` `build:` | `docs: README` | unchanged |

`scripts/bump-version.mjs` writes it to `package.json`, and the build shows it in the footer of
every page. After a successful deploy the workflow commits `chore(release): vX.Y.Z [skip ci]` to
`main` and tags `vX.Y.Z`, so **pull after pushing** (`git config pull.rebase true` once makes
`git pull` handle it cleanly).
