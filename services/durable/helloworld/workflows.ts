import { Durable } from '@hotmeshio/hotmesh';
import * as activities from './activities';

const { helloworld } = Durable.workflow.proxyActivities<typeof activities>({ activities });

export async function helloworldExample(name: string): Promise<string> {
  return await helloworld(name);
}
