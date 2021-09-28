near-runner + AVA
==================

A thin wrapper around [near-runner] to make it easier to use with [AVA] and [TypeScript]. If you don't want AVA, use near-runner directly.

Write tests once, run them both on [NEAR TestNet](https://docs.near.org/docs/concepts/networks) and a controlled [NEAR Sandbox](https://github.com/near/sandbox) local environment.


  [near-runner]: https://github.com/near/runner-js
  [AVA]: https://github.com/avajs/ava
  [TypeScript]: https://www.typescriptlang.org/

Quick Start
===========

`near-runner-ava --bootstrap` is a one-time command to quickly initialize a project with `near-runner-ava`. You will need [NodeJS] installed. Then:

    npx near-runner-ava --bootstrap

It will:

* Add a `near-runner` directory to the folder where you ran the command. This directory contains all the configuration needed to get you started with near-runner-ava, and a `__tests__` subfolder with a well-commented example test file.
* Create `test.sh` and `test.bat` scripts in the folder where you ran the command. These can be used to quickly run the tests in `near-runner`. Feel free to integrate test-running into your project in a way that makes more sense for you, and then remove these scripts.
* Install `near-runner-ava` as a dependency using `npm install --save-dev` (most of the output you see when running the command comes from this step).

  [NodeJS]: https://nodejs.dev/

Manual Install
==============

1. Install.

   ```bash
   npm install --save-dev near-runner-ava # npm
   yarn add --dev near-runner-ava         # yarn
   ```

2. Configure.

   You can use the `near-runner-ava` script to run `ava` using a [custom configuration file](./ava.config.cjs). You can add this to your `test` script in your `package.json`:

       "test": "near-runner-ava"

   Now you can run tests with `npm run test` or `yarn test`.

   If you want to write tests with TypeScript (recommended), you can add a `tsconfig.json` to your project root with the following contents:

       {"extends": "near-runner-ava/tsconfig.ava.json"}

   If you already have TypeScript set up and you don't want to extend the config from `near-runner-ava`, feel free to just copy the settings you want from [tsconfig.ava.json](./tsconfig.ava.json).

2. Initialize.

    Make a `__tests__` folder, make your first test file. Call your first test file `main.spec.ts` if you're not sure what else to call it.

    (near-runner-ava find files that match `*.ava.(ts|js)` suffix. "Project-wide" here means "the directory in which you run `near-runner-ava`.")

    In `main.ava.ts`, set up a `runner` with NEAR accounts, contracts, and state that will be used in all of your tests.

   ```ts
   import path from 'path';
   import {Runner} from 'near-runner-ava';

   const runner = Runner.create(async ({root}) => {
      const alice = await root.createAccount('alice');
      const contract = await root.createAndDeploy(
        'contract-account-name',
        path.join(__dirname, '..', 'path', 'to', 'compiled.wasm'),
      );

      // make other contract calls that you want as a starting point for all tests

      return {alice, contract};
   });
   ```

4. Write tests.

   ```ts
    runner.test("does something", async (t, { alice, contract }) => {
      await alice.call(contract, "some_update_function", {
        some_string_argument: "cool",
        some_number_argument: 42,
      });
      const result = await contract.view("some_view_function", {
        account_id: alice,
      });
      // When --verbose option is used this will print neatly underneath the test in the output.
      t.log(result)
      // Same as `Object.is`
      t.is(result, "whatever");
      t.deepEqual(NEAR.parse("1 N"), NEAR.parse("1.0 N"));
    });

    runner.test("does something else", async (t, { alice, contract }) => {
      const result = await contract.view("some_view_function", {
        account_id: alice,
      });
      t.is(result, "some default");
    });
    ```

    `runner.test` is added to `near-runner` by `near-runner-ava`, and is shorthand for:

    ```ts
    import test from 'ava';

    test('does something', async (t) => {
      await runner.run(async ({…}) => {
        // tests go here
      });
    });
   ```

   `runner.test` is added to `near-runner` by `near-runner-ava`, and is shorthand for:

   ```ts
   import test from 'ava';

   test('does something', async (t) => {
     await runner.run(async ({…}) => {
       // tests go here
     });
   });
   ```

   Where `test` comes [from AVA](https://github.com/avajs/ava/blob/main/docs/01-writing-tests.md) and `runner.run` comes [from near-runner](https://github.com/near/runner-js#how-it-works).

See the [`__tests__`](https://github.com/near/runner-js/tree/main/__tests__) directory in `near-runner-js` for more examples.

AVA's test assertions
===============

The `t` argument passed to tests provides a set of assertions to use to get pretty output when tests fails. It also provides `t.log` function to print complex object and organize logs under test results if `--verbose` is passed.

Special Mentions
----

<details> <summary> <code>.is(value, expected, message?</code>)</summary>

Assert that `value` is the same as `expected`. This is based on [`Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is). Returns a boolean indicating whether the assertion passed.
</details>

<details> <summary> <code>.deepEqual(value, expected, message?)</code></summary>

Assert that `value` is deeply equal to `expected`. See [Concordance](https://github.com/concordancejs/concordance) for details. In AVA 3 this works with [React elements and `react-test-renderer`](https://github.com/concordancejs/react).

</details>

`deepEqual` should be used if comparing complex objects since `is` checks for pointer equality. E.g.

```ts

t.is({a: 10}, {a: 10}) // fails since they are two separate objects
t.deepEqual({a: 10}, {a: 10}) // passes since internal properities are equal

```
Example output:
```
   25:   
   26:   t.is({a: 10}, {a: 10});
   27: });

  Values are deeply equal to each other, but they are not the same:

  {
    a: 10,
  }
```
<details>
<summary> Rest of initial assertions to know about: </summary>
#### `.true(value, message?)`

Assert that `value` is `true`. Returns a boolean indicating whether the assertion passed.

#### `.false(value, message?)`

Assert that `value` is `false`. Returns a boolean indicating whether the assertion passed.

#### `.not(value, expected, message?)`

Assert that `value` is not the same as `expected`. This is based on [`Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is). Returns a boolean indicating whether the assertion passed.


#### `.notDeepEqual(value, expected, message?)`

Assert that `value` is not deeply equal to `expected`. The inverse of `.deepEqual()`. Returns a boolean indicating whether the assertion passed.

#### `.like(value, selector, message?)`

Assert that `value` is like `selector`. This is a variant of `.deepEqual()`, however `selector` does not need to have the same enumerable properties as `value` does.

Instead AVA derives a *comparable* object from `value`, based on the deeply-nested properties of `selector`. This object is then compared to `selector` using `.deepEqual()`.

Any values in `selector` that are not regular objects should be deeply equal to the corresponding values in `value`.

In the following example, the `map` property of `value` must be deeply equal to that of `selector`. However `nested.qux` is ignored, because it's not in `selector`.

```js
t.like({
	map: new Map([['foo', 'bar']]),
	nested: {
		baz: 'thud',
		qux: 'quux'
	}
}, {
	map: new Map([['foo', 'bar']]),
	nested: {
		baz: 'thud',
	}
})
```

Finally, this returns a boolean indicating whether the assertion passed.

#### `.throwsAsync(thrower, expectation?, message?)`

Assert that an error is thrown. `thrower` can be an async function which should throw, or a promise that should reject. This assertion must be awaited.

The thrown value *must* be an error. It is returned so you can run more assertions against it. If the assertion fails then `undefined` is returned.

`expectation` can be an object with one or more of the following properties:

* `instanceOf`: a constructor, the thrown error must be an instance of
* `is`: the thrown error must be strictly equal to `expectation.is`
* `message`: either a string, which is compared against the thrown error's message, or a regular expression, which is matched against this message
* `name`: the expected `.name` value of the thrown error
* `code`: the expected `.code` value of the thrown error

`expectation` does not need to be specified. If you don't need it but do want to set an assertion message you have to specify `undefined`. (AVA 3 also allows you to specify `null`. This will be removed in AVA 4. You can opt into this change early by enabling the `disableNullExpectations` experiment.)

Example:

```js
test('throws', async t => {
	await t.throwsAsync(async () => {
		throw new TypeError('🦄');
	}, {instanceOf: TypeError, message: '🦄'});
});
```

```js
const promise = Promise.reject(new TypeError('🦄'));

test('rejects', async t => {
	const error = await t.throwsAsync(promise);
	t.is(error.message, '🦄');
});
```

#### `.notThrows(fn, message?)`

Assert that no error is thrown. `fn` must be a function which shouldn't throw. Does not return anything.

#### `.notThrowsAsync(nonThrower, message?)`

Assert that no error is thrown. `nonThrower` can be an async function which shouldn't throw, or a promise that should resolve.

Like the `.throwsAsync()` assertion, you must wait for the assertion to complete:

```js
test('resolves', async t => {
	await t.notThrowsAsync(promise);
});
```

Does not return anything.

#### `.regex(contents, regex, message?)`

Assert that `contents` matches `regex`. Returns a boolean indicating whether the assertion passed.

#### `.notRegex(contents, regex, message?)`

Assert that `contents` does not match `regex`. Returns a boolean indicating whether the assertion passed.
</details>



Configuring AVA
================

By default, `near-runner-ava` includes a minimal [ava.config.cjs](./ava.config.cjs)<sup>[1](#noteOnCjs)</sup>.

The default patterns for matching test files are `"**/*.ava.js"` & `"**/*.ava.ts"`, e.i. all JS and TS files that end in `.ava.*s`.

To override or extend these settings, add your own `ava.config.cjs` to the root of your project and import near-runner-ava's as a starting point. For example, to set `testMatch` back to [AVA's default](https://github.com/avajs/ava/blob/678f9caf22343ba05efd54cbfebb37962f590cab/docs/05-command-line.md):

```js
const config = require("near-runner-ava/ava.config.cjs"); // Need to provide extension

module.exports = {
  ...config,
  files: [
    "test.js",
    "src/test.js",
    "source/test.js",
    "**/test-*.js",
    "**/*.spec.js",
    "**/*.test.js",
    "**/test/**/*.js",
    "**/tests/**/*.js",
    "**/__tests__/**/*.js",
  ],
};
```

If you want to put this `ava.config.cjs` somewhere other than your project root, you may need to update your `test` script in `package.json`:
```diff
- "test": "near-runner-ava"
+ "test": "near-runner-ava --config configDir/ava.config.cjs"
```


Note that command-line flags other than `--bootstrap` get passed along to the `ava` command; see [AVA's CLI options](https://github.com/avajs/ava/blob/678f9caf22343ba05efd54cbfebb37962f590cab/docs/05-command-line.md) for possibilities. `ava debug` is particularly useful for debugging your tests.

<a name="noteOnCjs">1</a>: `.cjs` stands for [Common JS](https://en.wikipedia.org/wiki/CommonJS), which is node's default javascript loader but AVA uses its own and needs the extension to know which one to use.
