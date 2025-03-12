---
"near-workspaces": major
---

Implemented GitHub Actions Workflows:
- Add to the DevTools project
- Automate package release to npm

Update:
- Node.js -> 20.0.0
- TypeScript -> 5.4.5
- TSConfig(target) -> ES2022
- Borsh -> 2.0.0
- Near-api-js -> 5.1.0

BREAKING CHANGES:
- Replaced Yarn + Lerna with pnpm
- Removed bn.js and near-units → Now using TypeScript’s native BigInt
- Removed outcome files (/dist) from the repository
- Borsh update: Now requires an explicit Schema parameter for serialization/deserialization
- Added changeset package to simplify the release flow
- Removed rimraf, use fs-extra instead
