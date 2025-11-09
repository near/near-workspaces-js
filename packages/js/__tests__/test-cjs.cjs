// Simple test file to verify CJS import works
const nearWorkspaces = require('near-workspaces');

console.log('Testing CommonJS import...');
console.log('Worker:', nearWorkspaces.Worker ? '✓' : '✗');
console.log('ONE_NEAR:', nearWorkspaces.ONE_NEAR ? '✓' : '✗');
console.log('parseNEAR:', nearWorkspaces.parseNEAR ? '✓' : '✗');
console.log('SandboxWorker:', nearWorkspaces.SandboxWorker ? '✓' : '✗');

if (nearWorkspaces.Worker && nearWorkspaces.ONE_NEAR && nearWorkspaces.parseNEAR && nearWorkspaces.SandboxWorker) {
  console.log('✓ CommonJS imports work correctly!');
  process.exit(0);
} else {
  console.log('✗ CommonJS imports failed!');
  process.exit(1);
}
