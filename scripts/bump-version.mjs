#!/usr/bin/env node
// Picks the next version from the commit messages since the last v* tag (Conventional Commits) and
// writes it to package.json / package-lock.json. Used by .github/workflows/deploy.yml.
//
//   feat!: … / BREAKING CHANGE   → major   1.4.2 → 2.0.0
//   feat: …                      → minor   1.4.2 → 1.5.0
//   anything else                → patch   1.4.2 → 1.4.3
//   only docs/chore/ci/style/test/build → no change
//
// Without a v* tag yet, it looks at the commits of this push (BEFORE_SHA..HEAD), or just HEAD.
// Writes `version` and `bumped` to $GITHUB_OUTPUT when run in GitHub Actions.
import { execSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const tryShell = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

const lastTag = tryShell('git describe --tags --abbrev=0 --match "v[0-9]*"');
const before = process.env.BEFORE_SHA ?? '';
const validBefore = before && !/^0+$/.test(before) && tryShell(`git cat-file -t ${before}`) === 'commit';
const range = lastTag ? `${lastTag}..HEAD` : validBefore ? `${before}..HEAD` : 'HEAD~1..HEAD';

// %x1e separates commits; subject and body together, so "BREAKING CHANGE" in a body counts.
const messages = tryShell(`git log --format=%B%x1e ${range}`)
  .split('\x1e')
  .map((m) => m.trim())
  .filter((m) => m && !/^chore\(release\)/.test(m));

const NO_RELEASE = /^(docs|chore|ci|style|test|build)(\(.+\))?:/;
let bump = null;
for (const message of messages) {
  const subject = message.split('\n')[0];
  if (/^\w+(\(.+\))?!:/.test(subject) || /BREAKING[ -]CHANGE/.test(message)) bump = 'major';
  else if (/^feat(\(.+\))?:/.test(subject)) bump = bump === 'major' ? bump : 'minor';
  else if (!NO_RELEASE.test(subject)) bump ??= 'patch';
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const current = pkg.version;
let next = current;
if (bump) {
  const [major, minor, patch] = current.split('.').map(Number);
  next =
    bump === 'major'
      ? `${major + 1}.0.0`
      : bump === 'minor'
        ? `${major}.${minor + 1}.0`
        : `${major}.${minor}.${patch + 1}`;

  pkg.version = next;
  writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);

  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  lock.version = next;
  if (lock.packages?.['']) lock.packages[''].version = next;
  writeFileSync('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);
}

console.log(`${messages.length} commit(s) in ${range}; bump: ${bump ?? 'none'}; ${current} → ${next}`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${next}\nbumped=${bump ? 'true' : 'false'}\n`);
}
