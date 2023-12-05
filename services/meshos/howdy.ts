import { MeshOSConfig } from './config';

export class MyHowdyClass extends MeshOSConfig {

  workflowFunctions = ['ciao'];
  proxyFunctions = ['howdy'];

  async ciao(name: string): Promise<string> {
    return await this.howdy(name);
  }

  async howdy(name: string): Promise<string> {
    return `Hello ${name}!`;
  }
}
