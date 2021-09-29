near-runner
===========

Write tests once, run them both on [NEAR TestNet](https://docs.near.org/docs/concepts/networks) and a controlled [NEAR Sandbox](https://github.com/near/sandbox) local environment.

This is a monorepo for [near-runner-js] and [near-runner-ava]. See their READMEs for more specific info about each.

  [near-runner-js]: ./packages/js
  [near-runner-ava]: ./packages/ava


Quick Start
===========

[near-runner-ava] is a thin wrapper around [near-runner-js] designed to get you up and running as quickly as possible, with minimal configuration and power-boosts like [TypeScript](https://www.typescriptlang.org/). You can install it with one command. You will need [NodeJS](https://nodejs.dev/) installed. Then:

    npx near-runner-ava --bootstrap

This command will:

* Add a `near-runner` directory to the folder where you ran the command. This directory contains all the configuration needed to get you started with near-runner-ava, and a `__tests__` subfolder with a well-commented example test file.
* Create `test.sh` and `test.bat` scripts in the folder where you ran the command. These can be used to quickly run the tests in `near-runner`. Feel free to integrate test-running into your project in a way that makes more sense for you, and then remove these scripts.
* Install `near-runner-ava` as a dependency using `npm install --save-dev` (most of the output you see when running the command comes from this step).


Manual Install
==============

If you prefer a testing library other than AVA, you can use [near-runner-js] directly.

If you want to install near-runner-ava manually, see [its README][near-runner-ava].