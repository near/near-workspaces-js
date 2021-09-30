These tests use [near-runner-ava](https://github.com/near/runner-js/tree/main/packages/ava): delightful, deterministic local testing for NEAR smart contracts.

You will need to install [NodeJS](https://nodejs.dev/). Then you can use the `scripts` defined in [package.json](./package.json):

    npm run test

If you want to run `near-runner-ava` or `ava` directly, you can use [npx](https://nodejs.dev/learn/the-npx-nodejs-package-runner):

    npx near-runner-ava --help
    npx ava --help
