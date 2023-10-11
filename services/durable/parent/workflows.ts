import { Durable } from '@hotmeshio/hotmesh';
import * as activities from './activities';

const { parent } = Durable.workflow.proxyActivities<typeof activities>({ activities });

export async function parentExample(name: string): Promise<Record<string, string>> {
  const [
    activityOutput,
    childWorkflowOutput
  ] = await Promise.all([
    parent(name),
    Durable.workflow.executeChild<string>({
      args: [`${name} to CHILD`],
      taskQueue: 'child',
      workflowName: 'childExample',
      workflowId: '-'
    })
  ]);
  return { activityOutput, childWorkflowOutput };
}
