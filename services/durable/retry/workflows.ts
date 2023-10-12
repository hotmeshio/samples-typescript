import { Durable } from '@hotmeshio/hotmesh';
import * as activities from './activities';

const { unpredictableFunction } = Durable.workflow.proxyActivities<typeof activities>({ activities });

export async function retryExample(name: string): Promise<string> {
  return await unpredictableFunction(name);
}
