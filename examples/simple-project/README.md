# Simple project

This is the simplest project setup example with workspaces-js. You can copy it as the starting point when setup your project. 

## Usage
```
npm i
npm run test
```

## Setup your project

Assume you have written your smart contract. Setup and write workspaces-js test as this project is easy:

1. Build the contract to `.wasm` as place it in `contracts/`.
2. Install the `near-workspaces` and `ava` with `npm` or `yarn`.
3. Copy the ava.config.cjs to you project root directory.
4. Write test, place in `__tests__/`, end with `.ava.js`. You can refer to `__tests__/test-status-message.ava.js` as an example.
5. We're done! Run test with `npm run test` and continue adding more tests!