
# Retry

HotMesh retries `proxy` functions using a configurable backoff coefficient of 2 seconds. Adjust as necessary (max retries and max duration will be added in a subsequent release). For example.

```typescript
import { MeshOSConfig } from '../config';

export class MyRetryClass extends MeshOSConfig {

  workflowFunctions = ['retryMe'];
  proxyFunctions = [{ name: 'pleaseRetry', config: { backoffCoefficient: 10 }}];

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
```

Usage

```typescript
await new MyRetryClass({ id: 'myguid', await: true }).retryMe('HotMesh');
//Hello Retry HotMesh!
```
