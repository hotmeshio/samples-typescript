import { Durable } from '@hotmeshio/hotmesh';
import * as activities from './activities';

const { hi, bye } = Durable.workflow.proxyActivities<typeof activities>({ activities });

export async function sleepExample(name: string): Promise<string[]> {
  const response1 = await hi(name);
  await Durable.workflow.sleep('10 seconds');
  const response2 = await bye(name);

  return [response1, response2];
}