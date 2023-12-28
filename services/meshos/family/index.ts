import { MeshOSConfig } from '../config';

export class MyFamilyClass extends MeshOSConfig {

  workflowFunctions = ['parentWorkflow', 'childWorkflow'];
  proxyFunctions = ['childActivity'];

  async parentWorkflow(name: string): Promise<string> {
    const childActivity = await this.childActivity(name);
    const childWorkflow = await MeshOSConfig.MeshOS.executeChild({
      workflowName: 'childWorkflow',
      taskQueue: this.taskQueue,
      args: [name],
    });
    return `${childActivity} - ${childWorkflow}`;
  }

  async childActivity(name: string): Promise<string> {
    return `Hi, Activity ${name}!`;
  }

  async childWorkflow(name: string): Promise<string> {
    return `Hi, Workflow ${name}!`;
  }
}
  