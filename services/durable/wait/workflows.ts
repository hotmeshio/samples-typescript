import { Durable } from '@hotmeshio/hotmesh';
import * as activities from '../sleep/activities';

const { hi, bye } = Durable.workflow.proxyActivities<typeof activities>({ activities });

export async function waitExample(name: string): Promise<any[]> {
  const response1 = await hi(name);
  const [abc, xyz] = await Durable.workflow.waitForSignal(['abc', 'xyz']);
  const response2 = await bye(name);

  return [response1, response2, abc, xyz];
} 