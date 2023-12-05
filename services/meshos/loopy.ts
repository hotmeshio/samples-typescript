import { MeshOSConfig } from './config';

export class MyLoopyClass extends MeshOSConfig {

  workflowFunctions = ['loop'];
  proxyFunctions = ['loopy'];

  async loop(count: number): Promise<string[]> {
    const response = [];
    for (let i = 0; i < count; i++) {
      response.push(await this.loopy(i));
    }
    return response;
  }

  async loopy(index: number): Promise<string> {
    return `loopy cycle ${index}`;
  }
}
  