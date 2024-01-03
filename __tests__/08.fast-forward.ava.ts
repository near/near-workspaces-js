import {getNetworkFromEnv} from 'near-workspaces';

if (getNetworkFromEnv() === 'sandbox') {
  console.log('sandbox_fast_forward tests here');
}
