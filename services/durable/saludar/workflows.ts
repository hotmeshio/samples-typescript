import { Durable } from '@hotmeshio/hotmesh';
import * as activities from './activities';

const { greet, saludar } = Durable.workflow
  .proxyActivities<typeof activities>({
    activities
  });

export async function saludarExample(name: string, lang = 'es'): Promise<string> {
  if (lang === 'es') {
    return await saludar(name);
  } else {
    return await greet(name);
  }
}
