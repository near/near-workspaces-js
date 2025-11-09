// Simple test file to verify ESM import works
import * as nearWorkspaces from 'near-workspaces';

console.log('Testing ESM import...');
console.log('Worker:', nearWorkspaces.Worker ? '✓' : '✗');
console.log('ONE_NEAR:', nearWorkspaces.ONE_NEAR ? '✓' : '✗');
console.log('parseNEAR:', nearWorkspaces.parseNEAR ? '✓' : '✗');
console.log('SandboxWorker:', nearWorkspaces.SandboxWorker ? '✓' : '✗');

if (nearWorkspaces.Worker && nearWorkspaces.ONE_NEAR && nearWorkspaces.parseNEAR && nearWorkspaces.SandboxWorker) {
  console.log('✓ ESM imports work correctly!');
  process.exit(0);
} else {
  console.log('✗ ESM imports failed!');
  process.exit(1);
}
