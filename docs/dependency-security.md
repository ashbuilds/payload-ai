# Dependency security maintenance — 7 November 2026

This update addresses the 27 open Dependabot alerts reviewed on 7 November 2026.

| Package | Selected version | Dependabot alerts |
| --- | --- | --- |
| Next.js / eslint-config-next | 16.4.1 | 254, 255, 258, 259 |
| follow-redirects | 1.16.2 | 238, 239, 268 |
| Undici | 7.30.1 | 253, 262–265 |
| Zod | minimum 4.6.6, locked 4.6.7 | 260 |
| Happy DOM | 21.0.4 | 251, 266 |
| fast-uri | 4.2.3 | 247–250 |
| Vitest / @vitest/mocker | 4.1.12 | 243, 246 |
| Vite | 7.3.7 | 240–242, 244, 245 |
| deepmerge | 4.3.1 + local patch | 267 |

The fresh npm audit additionally identified qs, glob, and minimatch advisories. Overrides select qs 6.16.1, glob 14.0.2 for affected modern versions, and minimatch 11.0.1 for affected versions. Legacy glob 7 / minimatch 3 retain their compatible APIs. Vite is an explicit development dependency because changing the override alone left the old auto-installed peer in the lockfile.

## deepmerge patch and remaining scanner alert

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) has no published patched release. The [upstream report](https://github.com/TehShrike/deepmerge/issues/273) describes returned-object prototype poisoning through `__proto__` keys, including null-prototype targets and nested null values.

`patches/deepmerge@4.3.1.patch` rejects `__proto__` before both source merging and target copying, in the source and both distributed entrypoints. Other merge semantics are preserved. Regression tests resolve the actual dependency from Payload and exercise malicious source/target keys, nested null/primitive values, arrays, merge.all, and ordinary configuration merging. The original package reproduced the reported inherited `isAdmin` value; the patched package did not.

The patch is installed through `pnpm.patchedDependencies`. Version-based tools still report deepmerge 4.3.1. Do not dismiss or globally ignore this advisory merely to obtain a green audit. Replace the patch with an upstream fixed release when one is available.

**Scope:** these root-level overrides and the pnpm patch protect this repository's installation. They do not propagate to applications consuming the published plugin. Consumers must update their own lockfiles and apply an equivalent deepmerge patch to their Payload dependency. The plugin's direct Zod minimum does propagate upon release.

## Verification

Use Node 22 and pnpm 10.20.0, matching CI:

```sh
pnpm install --frozen-lockfile
pnpm test:int
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm audit
```

The browser suite starts its own server on port 3107 with a disposable SQLite database; it never reuses a developer's running server. It covers admin login, field/editor rendering, media and instruction screens, and authenticated post CRUD with rich-text persistence. A local `.env` is optional.

Model-provider tests use mocks. Three MiniMax live integration tests are skipped without credentials; real paid provider generation is not covered by this verification. No software test suite establishes that every possible configuration works.

### Results recorded for this change

- Node 22.23.4: 112 unit/integration tests passed; 3 credential-gated MiniMax tests skipped.
- Chromium: both browser/API regression scenarios passed, including the active AI plugin settings screen; no uncaught page errors.
- Plugin TypeScript checking and the distribution build passed.
- Frozen-lockfile installation passed.
- Production audit: zero advisories. Full audit: one low-severity deepmerge advisory, mitigated locally as described above.
- Lint on changed JavaScript/TypeScript files passed. Full-repository lint still reports 20 pre-existing errors: 15 source lint errors (independently reproduced in the original checkout) and 5 project-service configuration errors in the unchanged `eslint-config/` folder. Existing warnings also remain.

CI now uses Node 22 / pnpm 10.20.0 and runs the unit/integration and Chromium suites. The old build job's commit/rebase/push step was removed so checks do not mutate the branch or attempt to push to pull-request refs. Release workflows use the same pnpm version; this change does not trigger a release.
