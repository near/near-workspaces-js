# NEAR Workspaces (TypeScript/JavaScript Edition)

<div style="text-align:center;">
    
![](https://i.imgur.com/naPDKF5.jpg)
    
</div>

<div style="text-align:center"}>


![](https://img.shields.io/github/downloads/near/workspaces-js/total?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAhwAAAKjCAMAAABhvCbuAAAAM1BMVEX%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FlEOhHAAAAEHRSTlMAECAwQFBgcICQoLDA0ODwVOCoyAAAEhBJREFUeNrswYEAAAAAgKD9qRepAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA2bEP5AhAGAaApt7BwVj%2F%2F2zK1PRQUi32B6J5BLd4qU3xjLZ6iVTxX%2Bc%2BXL4p3nPLjjG%2BPuY%2BYsUnauSMX6Nwiw0DWuSM36Lw8g2DWuCM37yQumJCcZzxr8LId0zpQSwJo%2FG7FzpJMUmz2JF1PHcSMhmvMD2xF8zIQqVgSRUbKuaUczYGVMqzQXU6MpYV2zXlTJaEDZn0aiSSDqvYEf57h1WsUI5G27FFPWf8fv5FB3RnNP75K%2FXYdvvPQwXr7A%2BWhn2Fc6Y2MS7iK2TOmRrPw2G4sgRsaefhsFtZXAfO07HxcWy5shRsqmKYwz17d7bgKo4FUVQyGAwYi%2F%2F%2F2Z67X3oiM3BUWN7nvYdSrevDTuXFl832lR%2BblUuVPpOlvgKexINnO4T59INaAj4vk6cdV874fc%2FijVY5OW3oZ6nQK%2FMhjJAsaUtFmJmQPTvPr%2FvQXPnxqOGswpYKPyRtx%2BUzdbJUeCI93jDjlz2Jg6OzZKntEAYcXSfLdigDDmGeXf%2B2PTi0WXtfKuAQZup9qYBDmLGPpQKO4GTJXyrg8CdL%2FlIBhzDPbpcKOPRZu10q4NBn6napgEOfsfelAg5DsuS%2FbAIc%2FSfL8xAGHF0ny3yoA46AZMlfKuDQZ%2Bp2qYBDn3tnSwUcAcmSv1TAoc%2Br9rpUwKHP3u1SAYc%2Ba7dLBRz6zN0uFXDoc%2B9gqYCj02QZDmHA0Xey7ME4wHHsn%2FqyUXAYZu1gqYCjv2TZ03GA47j3uFTA4U%2BW%2FKUCDkuy5C8VcBhm72%2BpgMOfLPlLBRz%2BZMlfKuCwJ0v%2BUgGHIVli3wvXpnFqCg5wtOdLTJbQl43uf2U7CTjAsdVS1k9JluXnfwFLwAGOm%2F6UtyYulbUUFQc4rng39Jy3VJYCjotwlKEdykxpS2Uq4LgMR7nHJYuwVNpYLsQBjjJrOqp%2FqZyjquMAh5wsNWap7LVciQMc%2Bcky%2FqDNL8cBDjFZHvalcgKpjgMc%2Bcmy%2Fq6qdRzgiE%2BW%2B9nblAKON%2BEoU2iy1PZLnjoOcKQny3b%2Bpg0cb8NRnonJchdoXocDHHXPS5baBJg6DnBkJIuwVJYCjrfjKGNastwllOBQjyIiWYSl0sYCDgOOuGTZtI8rcKhHEZwsd5EjONSjyE2W2s7ctIHDgCMvWZ7qBxU41KOITZb5xE0bOAw4ApPl1k7ctIHDgCMwWZ76RxQ41KMITZb59E0bOAw4%2FMkiLJW9Gk4EHJnJ8jz54QQOPw4xWY7hvUtlsZ0ION6QLLd3LpXJdCLgSEyW5%2FmbNj8OcMjJsmlLRUhYAw5wiMmyvGep7NV3IuDIS5b91E0bOAw44pLlcSZhwWHBkZYsg3DTBg7nUSz%2BZNmFmzZwWI9icyfLQ88UCw5w%2BJNlkG7awOE9ips3WXZ9RYHDdxSDM1keeqZYcIDDnyyDvp48OMDhT5ZdX04eHOCwJ8tDvWnz4QCHOVkGPWFtOMDhTZb60jPFhwMc1mRZ9Js2Jw5wGJNl0BPWiwMcvmRZ9Zs2Mw5w2JKl6TdtbhzgcCWLnil2HOBwJcv5m7Y8HOBQk2X82f%2F9vQacCDhcyTL85JlmjT0RcPiTZRRu2gJwgENMludpeVPEiYDDmSzruZ90tDH8RMDhT5b76%2FjrbLf8EwGHP1mG6XG%2FZZ8IOPzJog84Ao7ioScLOHrFUVYtWcDRAQ5%2FsoCjg6OoerKAo1cc6ssZRnB0jCM%2FWfw4wBGfLAE4wJGfLH4c4EhPlgAc4MhPFj8OcMQnSwAOcOQnix8HOOKTJQAHOPzJko8DHKnJEoADHPHJEoADHGqy3MERjSMkWcCRjsOfLK8Kjo5xiMmygyMYR0yygCMehz9ZZnB0jMOfLPk4wJGeLOCIOIrZnyzpOMCRnSzgCDmKxGQJwQGO%2BvInSzgOcCQnCzhijuLuT5Z0HODITZYcHODwJ0s%2BDnCkJksSDnD4kyUeBzhCkyUKBzj8yZKPAxyRyRKGAxz%2BZMnHAY7AZInBAY68ZInDAQ41WSZwxOAIThZwpOPwJ0ur4AjBkZgsFRwZOKKTBRzxOPzJ8gBHxzj8yZKPAxxJyQKO2KOY%2FMmSjgMcOckCjuCjeOrJAo5ecdTdnyzhOMCRkizgiD6K0Z8s6TjAkZEs2TjA4U%2BWfBzgSEiWdBzg8CdLPA5wBCRLPA5wyMkCjgAc8ckCDj%2BO%2FGQBRwCO9GQBhx9HfrKAIx9HfrKAI%2B4obvfHNLwzWY4BHJ%2BJ47Ydf53X%2FZ3JcgPHJ%2BIY%2F7UxVkuygCMKx%2BlPhOWNybKB4%2BNwLOe%2Fg1xMlgUciTjO74otKlmycPClw55kAUc%2BjmE%2F8V%2FpT5YAHOAY2s%2F%2FK5f3J0sADnBM%2F8FGK%2F9vNj1ZwBGPYz5zReZPlgAc4Fh%2F%2B8h405MFHNE46vb7P9eDnizgCMZRd%2BX9w3qygCMXx9C0P9R6soAjFcfY1F%2FJ0ZMFHJk4Jv215XqygCMSx6I%2FKerJAo5IHKvwe57uZLHiAEfdD2GpuJPFiQMcwy78WfYnixEHOIZ2CEvFnyw%2BHOCY2qEsFX%2By2HCAYxYfEP3J4sIBjvXU30hzJssIjgwcdTv1rX3eZBnAkYCj7nJX%2BpPFggMcQzv3lX3uZHn%2B4TjAMbZz%2F4b8ybL%2BwTjAMek%2FrPQniwUHOBb9e2D9yWLBAY5VWPvWZAGHG0fdT9yAifO4KFnA4cUx7I4vF1%2F1ZAGHHcfQhJb0Jws4jDimdpxZKvpUPVnA4cUxH%2F9v5pD3yY3gMONYhW3vTxZwGHHUTXjvdECyiCcCDvEZ8R70CuwnOGw4hqb%2Fop4%2FWcDhwDG2Q18q%2FmQBhwHHdBz6UvEnCzgMOBbht78jkgUcb8OxCt%2BQE5Is4HgPjrofwlIJSRZwvAXHsB%2FCUolJFnC8AcfQDmGpxCQLON6AY2qHsFQSkuUOjjfhmJU78rRkAYeG48TT4In3wmUly6uC43ocdRMuyIOSZQfH5TjqLvz19qxkuRgHOIZ26EslJFlmcFyKY2zCFUZssoDjChyT%2Fs6UxGQBxwU4lh%2FFgGVmPVnAcQWOVboXz02Wm4ADHD9vg6XYRk6Wugk4wDGduGkTloo29aVtlmc7BBzgaNM4tUNbKgHJog849FmKde6fgwMcezHP%2FDE4wDEU96wfggMcj%2BKfHRzXTP5S0ZNFH3DkLxV%2FsoAjf6lkJws48peKP1nAkb9U%2FMkCjvyl4k8WcOQvlaxkAUf%2BUnElCzj0mYtlApIFHPIrlXpKFnAYvsM1P1nAkb9UopMFHPlLxZ8s4MhfKv5kAUf%2BUvEnCzhsSyX%2FbzqBI3%2BpxCQLOPSlEjVPcPxywpdKwMsZwBG%2FVAKSBRz63EvcjBk4wLGVwJn8OMChv2w0P1nAkb9U%2FMkCjvylkp8s4MhfKv5kAUf%2BUvEnCzjyl4o%2FWcCRv1T8yQKO%2FKXiTxZw5C%2BV5GQBR%2F5S8ScLOCLfC%2BdIFnC0%2FPfCpSdLK%2F7Jf0bzv2w0MlmepddZ85dKerKspdeZ85dKerLMpdcZ85dKerKMhSfSfs5n5Hn05Gz5SyU7WbbS70yGpRI3y3HdTKXfqV%2B5dLfjsqml41kjl0pAsughS6%2FstXzg3FrCm8%2Fy5%2FmVpzO8%2F8ejfHQ8On0S15%2B3%2BOjYy8fOwgfHibnlL5XUZLmV7ueRv1Qyk%2BVRvmD2%2FKXiT5b8f%2FzoU2qf3nFDZy%2BbSHqv2vTdlwf38iUzfekvMixcqrzllNbvvj1YyhfN8qWXCuvlNtgs83eH%2FPRn9u4aQXIYCqCgzGzp%2FpfdHW7mjqyq3PB%2BZlTITBPTvWIbtqON6UGxCdkpl3SfpQpbUi3pIUsZctTneWOwGNwXvUM5p1vmMmxPtevOMf9e9Zyumes8u3f5eavHdMlY59m9y6dop5iOxakttt%2Bddi7mU3fjHNO3OI9dnWF3hvkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAu8B4sHBquFOxpJ32%2Bs4fE6vwsHo92kf79BCuWOehq0JWjgbQhLv0aV%2B44D97d7YtuQqCARg1Dhn1%2FZ%2F2XJ%2F%2BE5Zhx9K1kNvecz4FkeqKRRCJ3obJ8EXePcT1hd3Nq8VRyvYhjvQbHKFArPQmjvImcjJacZRtHBzyZ5u%2FyCqTR8XTEeNYfoLDlpsIkq2nPrJXiqO4r3BQboiDrxgOGa%2F6WJXiOD%2FDkX6B4yp3Yb%2FNKxiHUYmjpK9wmKs9Dv%2FBl7FFEKdRiSPbj3CQa49jL7dxSQ889XGoxFGOr3BQaIiDX%2FRefmCZdQeHo8SvcJC7WuJgGm0bvYogKZ4XlTiy%2FQoHmfSOR5SVoxiGXoUVbB6XShxll%2BPAWFJ9vLSxiJVhGJ%2FuYz2Og9%2FmdOEoXoCjQ2w%2FW9Y27AUiG5U4shkcB9y5QbjPv1uCbxdU4ij76DjwMHQeUJJ%2BHPbAhqFGHGUZHwed%2F9y27a33fMhjVieOywyPw%2F3bdgjt9%2Fwdy16FOMo6PI4VaozcuIUJZc6uBccOiWVwHBnS%2F9Z4z4c6J2vBYTIklqFxYBLBRNOaZDFKcEAvOg2MA9K%2FwY5p%2FkEyW7TsHDBx50bGYe8OrlF2%2ByYfEvBKcCxkMxzjx8WR7h6SaVwuAsqkBgfMbqWBcVy3zfK9fUmqFQed0OQZFYe%2Frz19szbExOFg7mdIHMypNbe6fZs4ILHEQXEYNNzwMDFxxLvxmWzHxBGfOuWu9e2bU3Mvi4tgwcQyIo7z8Y7tbNykCir7HOn%2BVUJ%2BOBz8%2FoCN05a9N6cLh7lw7mc4HNvz8jUNJy7gyxfShQMSyz4eDgNnkkc4rmnv7dCGg3ZILDIc7ngXqzDvJ7YD0jKflVULjgPX5UNiCVU4XC58yCfGD6ZT1%2FL2DXKuU4eDfOHXx1KFIzV7uZvl097arCS1J4y4q8MBiWXpi%2BPl07eNygJ8XVzSiMPi3M9IODBv1GcdeQR8aZPViAPmftZhcEDW2%2BrrVXksccvqXkr92BKAuZ8OOKRtKP6k%2B2BJENmowAFPmZ%2F7cV1xWL4mxFaHb2OjeFKKg5%2F76Yoj8sdf3Nr2inOxIDZSiwPmftwQOODe2Ag%2B5hMcJynGAXM%2FfXAIdgX43rEBjtNoxoFzP31wCOoJqEu%2Bx7EbUoUD6n6c%2B2mLI7vXd25ZcKL5AkciBcH0Qbm5n%2FweR2gya7PWfdj2LY7TkXoctD4llqMSR4Mm9lmxJYDfbD7EcQWiieNh7qcfDiiTz9rSJHyGYw9EEwcz99MNB9y5SRTJceQ9WKKJg5n76Yqj8jXuUE5bKQ5YGhMHM%2FfTBYegzoxYuVbgSBwbP3Gw%2F%2FH81hfHXv%2BwzP9VS3CYizlrTxwPcz%2BpEw7sbckhVeAgx7ZFJw6c%2B%2BmII9WmCtz0dgkOirhxThzc3E9HHFhk1hevVoIDNs44cbDV%2FNINh8eGbf2xN4lwmBN%2B%2B4mDn%2Ftpj0PY2GIqhkuEgxyc1yYOfu6nDw4DT%2BlVq32R4MBBsXPi4Od%2BfBccEWtDeVekGgdtUHRNHNyJbmmPQ7oRMC96NiIcuDbCxMEllg5NMCghBEWKCAcWXdlNHPzbZbXHwT%2Fp9P54cwpxkOfeNGDiWPrjMJVtCwa1E%2BKglbmCmzho7Y4jSB7PCiWpCAcdc0yQW7dXVxzwfILkMiaLcZj83AubOGjpigMes5CUFActzLurThy0y3HIazguQQiS0SHGQZG5oJ04TP4LjnKmmoji0lJexiIOfnGgz4mDvBxHfcSqb36JD8BiHFh1hYkD105THKnqe0fpm1ZfchzkmHeunThs7obDQiNcOAPi5TgoPPfCJg6K3XBEeQ8qwacKceAV3KEYB8bRC8clnwKHTUeOw5zPF7QTh819cCyyJgdfrtTjwMkfZDpxUOqDY5OuVywVLhEO%2BFp4QTtx0NkDh8l%2FOiXAZ8tx0PrcC5s4zNkBR5DP6eG%2BswlwMGXXNnFwOtrjOP%2FWfHI4eyrHAUeWqBgHRsp1OOJnOJjzhqDVsfwNB4Ws5Dy7STZIE4%2BqhbyV6uALvPTHleoz1%2Blw%2BW2BGfYM1jSE5vivPTgQAAAAAADyf20EVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUB9Ezshr8WzrMAAAAASUVORK5CYII%3D)[![Project license](https://img.shields.io/badge/license-Apache2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)[![Project license](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)[![Discord](https://img.shields.io/discord/490367152054992913?label=discord)](https://discord.gg/Vyp7ETM)[![NPM version](https://img.shields.io/npm/v/near-workspaces.svg?style=flat-square)](https://npmjs.com/near-workspaces)[![Size on NPM](https://img.shields.io/bundlephobia/minzip/near-workspaces.svg?style=flat-square)](https://npmjs.com/near-workspaces)

</div>

`NEAR Workspaces` is a library for automating workflows and writing tests for NEAR smart contracts. You can use it as is or integrate with test runner of your choise (AVA, Jest, Mocha, etc.). If you don't have a preference, we suggest you to use AVA.

<div style="text-align:center"

## [Features](##Features) | [Installation](##Installation) | [Quick-Start Guide](##Quick-Start-Guide) | [How to Contribute](##How-to-Contribute) | [Pro Tips](##Pro-Tips) | [Community](##Community)

</div>

## Features

- Deploy your own development Node
- Multi Test Suite Environment (Ava Suggested)
- Development Account Creation and Contract Deployment
- Modifyable Node Test Environment
- Interface widely accessable with tooling in Javascript

## Installation and Initialization

You can install near-workspaces in to your project by running the following.

```
npm i near-workspaces
```

## Examples and Getting Started

Get started with `Near Workspaces` by:

### 1. Initializing a `Workspace`

This will be used as the starting point for more workspaces soon.

```ts
const workspace = await Workspace.init(async ({ root }) => {
  const alice = await root.createAccount("alice");
  const contract = await root.createAndDeploy(
    "contract-account-name",
    "path/to/compiled.wasm"
  );
  return { alice, contract };
});
```

**Let's step through this.**

1.  `Workspace.init` initializes a new [NEAR Sandbox](https://docs.near.org/docs/develop/contracts/sandbox) node/instance. This is essentially a mini-NEAR blockchain created just for this test. Each of these Sandbox instances gets its own data directory and port so tests can run in parallel.
2.  This blockchain also has a `root` user. Mainnet has `*.near`, testnet has `*.testnet`, and these tests have `*.${root.accountId}`. This account name is not currently `sandbox` but might be in the future. Since it doesn't matter, you can think of it as being called `sandbox` while you're still figuring things out.
3.  `root.createAccount` creates a new subaccount of `root` with the given name, for example `alice.sandbox`.
4.  `root.createAndDeploy` creates a new subaccount with the given name, `contract-account-name.sandbox`, then deploys the specified Wasm file to it.
5.  `path/to/compiled.wasm` will resolve relative to your project root. That is, the nearest directory with a `package.json` file, or your current working directory if no `package.json` is found. To construct a path relative to your test file, you can use `path.join(__dirname, '../etc/etc.wasm')` See the [nodejs path.join documentation](https://nodejs.org/api/path.html#path_path_join_paths) for more on this.
6.  After `Workspace.create` finishes running the function passed into it, it gracefully shuts down the Sandbox instance it ran in the background. However, it keeps the data directory around. That's what stores the state of the two accounts that were created (`alice` and `contract-account-name` with its deployed contract).
7.  `workspace` contains a reference to this data directory, so that multiple tests can use it as a starting point.
8.  The object returned, `{alice, contract}`, will be passed along to subsequent tests.

### 2. Writing tests.

`near-workspaces` is designed for concurrency. Here's a simple way to get concurrent runs using plain JS:

```ts
import {strict as assert} from 'assert';

await Promise.all([
  workspace.fork(async ({alice, contract}) => {
    await alice.call(
      contract,
      'some_update_function',
      {some_string_argument: 'cool', some_number_argument: 42}
    );
    const result = await contract.view(
      'some_view_function',
      {account_id: alice}
    );
    assert.equal(result, 'whatever');
  }),
  workspace.fork(async ({alice, contract}) => {
    const result = await contract.view(
      'some_view_function',
      {account_id: alice}
    );
    /* Note that we expect the value returned from `some_view_function` to be
    a default here, because this `fork` runs *at the same time* as the
    previous, in a separate local blockchain */
    assert.equal(result, 'some default');
  });
]);
```

**Let's step through this.**

1.  Like the earlier call to `Workspace.init`, each call to `workspace.fork` sets up its own Sandbox instance. Each will copy the data directory set up earlier as the starting point for its tests. Each will use a unique port so that tests can be safely run in parallel.
2.  `call` syntax mirrors [near-cli](https://github.com/near/near-cli) and either returns the successful return value of the given function or throws the encountered error. If you want to inspect a full transaction and/or avoid the `throw` behavior, you can use `call_raw` instead.
3.  While `call` is invoked on the account _doing the call_ (`alice.call(contract, …)`), `view` is invoked on the account _being viewed_ (`contract.view(…)`). This is because the caller of a view is irrelevant and ignored.
4.  Gotcha: the full account names may or may not match the strings passed to `createAccount` and `createAndDeploy`, which is why you must write `alice.call(contract, …)` rather than `alice.call('contract-account-name', …)`. But! The `Account` class overrides `toJSON` so that you can pass `{account_id: alice}` in arguments rather than `{account_id: alice.accountId}`. If you need the generated account ID in some other circumstance, remember to use `alice.accountId`.

See the [tests](https://github.com/near/workspaces-js/tree/main/__tests__) directory in this project for more examples.

## Quick Start with AVA

Since `near-workspaces` is designed for concurrency, AVA is a great fit, because it runs tests concurrently by default. To use`NEAR Workspaces` with AVA:

1.  Start with the basic [AVA setup](https://github.com/avajs/ava).
2.  Add custom script for running tests on Testnet (if needed). Check instructions in `Running on Testnet` section.
3.  Add your tests following these example:

```ts
import { Workspace } from "near-workspaces";
import anyTest, { TestFn } from "ava";

const test = anyTest as TestFn<{ workspace: Workspace }>;
test.before(async (t) => {
  t.context.workspace = await Workspace.init(async ({ root }) => ({
    contract: await root.createAndDeploy(
      "account-id-for-contract",
      "path/to/contract/file.wasm"
    ),
    /* Account that you will be able to use in your tests */
    ali: await root.createAccount("ali"),
  }));
});

test("Test name", async (t) => {
  /* Each test is making a "fork", a copy of the
  workspace, that was created in "before" function.
  It allows you to isolate each test and run them concurrently */
  await t.context.workspace.fork(async ({ contract, ali }) => {
    await ali.call(contract, "set_status", { message: "hello" });
    const result: string = await contract.view("get_status", {
      account_id: ali,
    });
    t.is(result, "hello");
  });
});
```

## "Spooning" Contracts from Testnet and Mainnet

[Spooning a blockchain](https://coinmarketcap.com/alexandria/glossary/spoon-blockchain) is copying the data from one network into a different network. near-workspaces makes it easy to copy data from Mainnet or Testnet contracts into your local Sandbox environment:

```ts
await workspace.fork(async ({ root }) => {
  const refFinance = await root.createAccountFrom({
    mainnetContract: "v2.ref-finance.near",
    blockId: 50_000_000,
    withData: true,
  });
});
```

The above code copies the Wasm bytes and contract state from [v2.ref-finance.near](https://explorer.near.org/accounts/v2.ref-finance.near) to your local blockchain as it existed at block `50_000_000`. This makes use of Sandbox's special [patch state](#patch-state-on-the-fly) feature to keep the contract name the same, even though the top level account might not exist locally (note that this means it only works in Sandbox testing mode). You can then interact with the contract in a deterministic way the same way you interact with all other accounts created with near-workspaces.

Gotcha: `withData` will only work out-of-the-box if the contract's data is 50kB or less. This is due to the default configuration of RPC servers; see [the "Heads Up" note here](https://docs.near.org/docs/api/rpc/contracts#view-contract-state). Some teams at NEAR are hard at work giving you an easy way to run your own RPC server, at which point you can point tests at your custom RPC endpoint and get around the 50kB limit.

See an [example of spooning](https://github.com/near/workspaces-js/blob/main/__tests__/05.spoon-contract-to-sandbox.ava.ts) contracts.

## Running on Testnet

near-workspaces is set up so that you can write tests once and run them against a local Sandbox node (the default behavior) or against [NEAR TestNet](https://docs.near.org/docs/concepts/networks). Some reasons this might be helpful:

- Gives higher confidence that your contracts work as expected
- You can test against deployed testnet contracts
- If something seems off in Sandbox mode, you can compare it to testnet

You can run in testnet mode in three ways.

1. When creating your Workspace, pass a config object as the first argument:

   ```ts
   const workspaces = await Workspace.init(
     {network: 'testnet'},
     async ({root}) => { … }
   )
   ```

2. Set the `NEAR_WORKSPACES_NETWORK` environment variable when running your tests:

   ```bash
   NEAR_WORKSPACES_NETWORK=testnet node test.js
   ```

   If you set this environment variable and pass `{network: 'testnet'}` to `Workspace.init`, the config object takes precedence.

3. If using `near-workspaces` with AVA, you can use a custom config file. Other test runners allow similar config files; adjust the following instructions for your situation.

   Create a file in the same directory as your `package.json` called `ava.testnet.config.cjs` with the following contents:

   ```js
   module.exports = {
     ...require("near-workspaces/ava.testnet.config.cjs"),
     ...require("./ava.config.cjs"),
   };
   ```

   The [near-workspaces/ava.testnet.config.cjs](https://github.com/near/workspaces-js/blob/main/ava.testnet.config.cjs) import sets the `NEAR_WORKSPACES_NETWORK` environment variable for you. A benefit of this approach is that you can then easily ignore files that should only run in Sandbox mode.

   Now you'll also want to add a `test:testnet` script to your `package.json`'s `scripts` section:

```diff
    "scripts": {
      "test": "ava",
   +  "test:testnet": "ava --config ./ava.testnet.config.cjs"
    }
```

## Stepping through a Testnet Example

Let's revisit a shortened version of the example from How It Works above, describing what will happen in Testnet.

1. Create a `Workspace`.

   ```ts
   const workspace = await Workspace.init(async ({ root }) => {
     await root.createAccount("alice");
     await root.createAndDeploy(
       "contract-account-name",
       "path/to/compiled.wasm"
     );
   });
   ```

   `Workspace.init` does not interact with Testnet at all yet. Instead, the function runs at the beginning of each subsequent call to `workspace.fork`. This matches the semantics of the sandbox that all subsequent calls to `fork` have the same starting point, however, testnet requires that each forkd workspace has its own root account. In fact `Workspace.init` creates a unique testnet account and each test is a unique sub-account.

   If you want to run a single script on Testnet, you can use `Workspace.open`:

   ```ts
   Workspace.open(async ({ root }) => {
     // Anything here will run right away, rather than needing a subsequent `workspace.fork`
   });
   ```

2. Write tests.

   ```ts
   await Promise.all([
     workspace.fork(async ({alice, contract}) => {
       await alice.call(
         contract,
         'some_update_function',
         {some_string_argument: 'cool', some_number_argument: 42}
       );
       const result = await contract.view(
         'some_view_function',
         {account_id: alice}
       );
       assert.equal(result, 'whatever');
     }),
     workspace.fork(async ({alice, contract}) => {
       const result = await contract.view(
         'some_view_function',
         {account_id: alice}
       );
       assert.equal(result, 'some default');
     });
   ]);
   ```

   Each call to `workspace.fork` will:

   - Get or create its own sub-account on testnet account, e.g. `t.rdsq0289478`. If creating the account the keys will be stored at `$PWD/.near-credentials/workspaces/testnet/t.rdsq0289478.json`.
   - Run the `initFn` passed to `Workspace.init`
   - Create sub-accounts for each `createAccount` and `createAndDeploy`, such as `alice.t.rdsq0289478`
   - If the test account runs out of funds to create accounts it will request a transfer from the root account.
   - After the test is finished each account created is deleted and the funds sent back to the test account.

Note: Since the testnet accounts are cached, if account creation rate limits are reached simply wait a little while and try again.

## Skipping Sandbox-specific Tests

If some of your runs take advantage of Sandbox-specific features, you can skip these on testnet in a few ways:

1. `runSandbox`: Instead of `workspace.fork`, you can use `workspace.forkSandbox`:

   ```ts
   await Promise.all([
     workspace.fork(async ({…}) => {
       // runs on any network, sandbox or testnet
     }),
     workspace.runSandbox(async ({…}) => {
       // only runs on sandbox network
     });
   ]);
   ```

2. `Workspace.networkIsSandbox`: You can also skip entire sections of your files by checking `Workspace.networkIsSandbox` (`Workspace.networkIsTestnet` and `Workspace.getNetworkFromEnv` are also available).

   ```ts
   let workspaces = Workspace.init(async ({root}) => ({ // note the implicit return
     contract: await root.createAndDeploy(
       'contract-account-name',
       'path/to/compiled.wasm'
     )
   }));
   workspace.fork('thing that makes sense on any network', async ({…}) => {
     // logic using basic contract & account interactions
   });
   if (Workspace.networkIsSandbox) {
     workspace.fork('thing that only makes sense with sandbox', async ({…}) => {
       // logic using patch-state, fast-forwarding, etc
     });
   }
   ```

3. Use a separate testnet config file, as described under the "Running on Testnet" heading above.

## Quick-Start Guide

This is the simplest project setup example with workspaces-js. You can copy it as the starting point when setup your project.

First run..

```
git clone https://github.com/near/workspaces-js.git
```

Navigate to the following directory

```
cd examples/simple-project
```

### Setup your Project

Assume you have written your smart contract. Setup and write workspaces-js test as this project is easy:

1. Build the contract to `.wasm` as place it in `contracts/`.
2. Install the `near-workspaces` and `ava` with `npm` or `yarn`.
3. Copy the `ava.config.cjs` to you project root directory.
4. Write test, place in `__tests__/`, end with `.ava.js`. You can refer to `__tests__/test-status-message.ava.js` as an example.
5. We're done! Run test with `npm run test` and continue adding more tests!

## Pro Tips

- `NEAR_WORKSPACES_DEBUG=true` – run tests with this environment variable set to get copious debug output and a full log file for each Sandbox instance.
- `Workspace.init` [config](https://github.com/near/workspaces-js/blob/main/packages/js/src/interfaces.ts) – you can pass a config object as the first argument to `Workspace.init`. This lets you do things like:

  - skip initialization if specified data directory already exists

  ```ts
  Workspace.init(
    { init: false, homeDir: './test-data/alice-owns-an-nft' },
    async ({root}) => { … }
  )
  ```

  - always recreate such data directory instead (the default behavior)
  - specify which port to run on
  - and more!

### Patch State on the Fly

In Sandbox-mode, you can add or modify any contract state, contract code, account or access key with `patchState`.

Sometimes scenarios arise wher you want to modify the state of a contract. For example, for test purposes you may want to modify another person's NFT,

This is called **"aritrary mutation on contract state"** and cand be done with `patchState`

Alternatively you can stop the node, dump state at genesis, edit genesis, and restart the node. The latter approach is more complicated to do and also cannot be performed without restarting the node.

Of course you can alter the contract code, accounts and access keys using normal transactions with `DeployContract`

It is true that you can alter contract code, accounts, and access keys using normal transactions via the `DeployContract`, `CreateAccount`, and `AddKey` [actions](https://nomicon.io/RuntimeSpec/Actions.html?highlight=actions#actions). But this limits you to altering your own account or sub-account. `patchState` allows you to perform these operations on any account.

To see an example of how to do this, see the [patch-state test](https://github.com/near/workspaces-js/blob/main/__tests__/02.patch-state.ava.ts).

## How to Contribute

### Bugs and Fixes

If you would like to contribute, please [open a Pull Request](https://github.com/near/workspaces-js/pulls) or report an [issue](https://github.com/near/workspaces-js/pulls) with as much detail as possible.

You can also stay up to date by following the project changelog.

### Community

Our comminity is active on [Discord](https://discord.com/invite/UY9Xf2k). Many of us from NEAR/Pagoda Devrel are in there responding to questions directly. Join in on the conversation! We'd love your input.
