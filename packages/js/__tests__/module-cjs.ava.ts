/**
 * Test that verifies the CommonJS export works correctly
 */
import test from 'ava';

test('CommonJS import works', t => {
  // Dynamically import the built CJS version
  const nearWorkspaces = require('near-workspaces');
  
  // Verify key exports exist
  t.truthy(nearWorkspaces.Worker, 'Worker should be exported');
  t.truthy(nearWorkspaces.ONE_NEAR, 'ONE_NEAR should be exported');
  t.truthy(nearWorkspaces.parseNEAR, 'parseNEAR should be exported');
  t.truthy(nearWorkspaces.SandboxWorker, 'SandboxWorker should be exported');
  t.is(typeof nearWorkspaces.Worker, 'object', 'Worker should be an object');
  t.is(typeof nearWorkspaces.parseNEAR, 'function', 'parseNEAR should be a function');
});
