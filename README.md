near-workspaces
===============

Controlled, concurrent workspaces in local [NEAR Sandbox](https://github.com/near/sandbox) blockchains or on [NEAR TestNet](https://docs.near.org/docs/concepts/networks). Fun, deterministic testing and powerful scripting for NEAR.

This is a monorepo for [near-workspaces-js], [near-workspaces-ava], and [near-workspaces-init]. See their READMEs for more specific info about each.

  [near-workspaces-js]: ./packages/js
  [near-workspaces-ava]: ./packages/ava
  [near-workspaces-init]: ./packages/init


Quick Start
===========

[near-workspaces-ava] is a thin wrapper around [near-workspaces-js] designed to get you up and running as quickly as possible, with minimal configuration and power-boosts like [TypeScript](https://www.typescriptlang.org/). You can install it with one command. You will need [NodeJS](https://nodejs.dev/) installed. Then:

    npx near-workspaces-init

This command will:

* Add a `near-workspaces` directory to the folder where you ran the command. This directory contains all the configuration needed to get you started with `near-workspaces-ava`, and a `__tests__` subfolder with a well-commented example test file.
* Create `test.sh` and `test.bat` scripts in the folder where you ran the command. These can be used to quickly run the tests in `near-workspaces`. Feel free to integrate test-running into your project in a way that makes more sense for you, and then remove these scripts.
* Install NPM dependencies using `npm install`. Most of the output you see when running the command comes from this step. You can skip this: `npx near-workspaces-init --no-install`.


Manual Install
==============

If you prefer a testing library other than AVA, you can use [near-workspaces-js] directly.

If you want to install near-workspaces-ava manually, see [its README][near-workspaces-ava].