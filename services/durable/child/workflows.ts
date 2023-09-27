import { Durable } from '@hotmeshio/hotmesh';
import type * as activities from './activities';

const { child } = Durable.workflow.proxyActivities<typeof activities>();

export async function childExample(name: string): Promise<string> {
  return await child(name);
}
