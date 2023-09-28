import { Durable } from '@hotmeshio/hotmesh';
import type * as activities from './activities';

const { remote } = Durable.workflow.proxyActivities<typeof activities>();

export async function remoteExample(name: string): Promise<string> {
  console.log('remoteExample is executing on service_b');
  return await remote(name);
}
