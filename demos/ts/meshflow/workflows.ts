import { MeshFlow } from '@hotmeshio/hotmesh';
import * as activities from './activities';

const { greet, saludar } = MeshFlow.workflow.proxyActivities<typeof activities>({
  activities,
  retryPolicy: {
    maximumAttempts: 1_000, //I hope not!
    maximumInterval: '5 seconds',
    backoffCoefficient: 2,
  }
});

async function example(name: string, lang: string): Promise<string> {
  //sleep for 5 seconds (to demonstrate function replay)
  await MeshFlow.workflow.sleepFor('5 seconds');

  //execute a proxied activity
  if (lang === 'es') {
    return await saludar(name);
  } else {
    return await greet(name);
  }
}

export { example };
