import { MeshOSConfig } from './config';

export class MyRetryClass extends MeshOSConfig {

  workflowFunctions = ['retryMe'];
  proxyFunctions = ['pleaseRetry'];

  async retryMe(name: string): Promise<string> {
    return await this.pleaseRetry(name);
  }

  async pleaseRetry(name: string): Promise<string> {
    if (Math.random() < 0.5) {
      throw new Error('Please retry');
    }
    return `Hello Retry ${name}!`;
  }
}
