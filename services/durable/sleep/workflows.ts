import { Durable } from '@hotmeshio/hotmesh';
import * as activities from './activities';

const { sleep } = Durable.workflow.proxyActivities<typeof activities>({ activities });

export async function sleepExample(name: string): Promise<string> {
  await Durable.workflow.sleep('10 seconds');
  return await sleep(name);
}
