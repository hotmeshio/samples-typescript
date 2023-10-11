import { Durable } from '@hotmeshio/hotmesh';
import * as activities from './activities';

const { looper } = Durable.workflow
  .proxyActivities<typeof activities>({ activities });

export async function looperExample(name: string): Promise<Record<string, string>> {
  const loopVal1 = await looper(`${name} - 1`);
  const loopVal2 = await looper(`${name} - 2`);

  const [
    parentWorkflowOutput,
    childWorkflowOutput,
    helloworldWorkflowOutput,
  ] = await Promise.all([

    Durable.workflow.executeChild<string>({
      args: [`${name} to PARENT`],
      taskQueue: 'parent',
      workflowName: 'parentExample',
      workflowId: '-'
    }),
  
    Durable.workflow.executeChild<string>({
      args: [`${name} to CHILD`],
      taskQueue: 'child',
      workflowName: 'childExample',
      workflowId: '-'
    }),

    Durable.workflow.executeChild<string>({
      args: [`${name} to HELLOWORLD`],
      taskQueue: 'helloworld',
      workflowName: 'helloworldExample',
      workflowId: '-'
    }),
  ]);

  return {
    loopVal1,
    loopVal2,
    parentWorkflowOutput,
    childWorkflowOutput,
    helloworldWorkflowOutput
  };
}
