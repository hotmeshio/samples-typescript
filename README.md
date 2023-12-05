# HotMesh TypeScript Examples

This repo demonstrates the use of HotMesh in a TypeScript environment. The examples shown are traditional TypeScript functions. But they are run as **reentrant processes** and are executed in a distributed environment, with all the benefits of a distributed system, including fault tolerance, scalability, and high availability.

All state-related code is managed by Redis. Write functions in your own preferred style, and HotMesh will handle the function execution. Consider the following function that is executed as a workflow:

```typescript
import Redis from 'ioredis';
import { MeshOS } from '@hotmeshio/hotmesh';

export class MyHowdyClass extends MeshOS {

  redisClass = Redis;

  redisOptions = { host: 'localhost', port: 6379 };

  workflowFunctions = ['ciao'];
  proxyFunctions = ['howdy'];

  async ciao(name: string): Promise<string> {
    return await this.howdy(name);
  }

  async howdy(name: string): Promise<string> {
    return `Hello ${name}!`;
  }
}
```

If you run the function as a vanilla NodeJS function (without passing a GUID), it will execute as usual governed by NodeJS.

```typescript
//run your functions as vanilla nodejs code
await new MyHowdyClass().ciao('fred');
  ```

But if you provide a workflow GUID to the constructor, the functions will be executed as a distributed workflow:

```typescript
//run your functions as distributed workflows
await new MyHowdyClass('myguid', { await: true }).ciao('fred');
```

## Repository Overview

This repository is a compilation of examples demonstrating the use of `HotMesh`. Refer to the [/meshos directory](/services/meshos/) for usage examples, including: executeChild, startChild, hook, signal, waitForSignal, proxyActivity, etc.

## Docker-Compose

The docker-compose configuration spins up **two** Node instances and 1 Redis instance (on port 6371). Workflows run on both as the workloads are distributed.

## Build
The application includes a docker-compose file that spins up one Redis instance and two Node instances. To build the application, run the following command:

```bash
docker-compose up --build -d
```

>The Node instance initializes a Fastify HTTP server on port `3002` and starts the various durable workers needed for the demo.

## Run
Open a browser and navigate to `http://localhost:3002/apis/v1/test/howdy` to invoke the `howdy` workflow. Additional workflows can be tested by invoking them in the same manner (e.g., `v1/test/loopy`, `v1/test/family`, `v1/test/sleepy`, `v1/test/signal`, `v1/test/retry`, `v1/test/inventory`).

## Telemetry Keys
*Optionally*, add a `.env` file to the project root and include your keys for honeycomb open telemetry if you wish to use the default tracer configuration located in `./services/tracer.ts`. The following keys are required to enable the default tracer in this project (but you can add your own tracer configuration and supporting keys if you use a different OpenTelemetry provider).

```
HONEYCOMB_API_KEY=XXXXXXXXXX
OTEL_SERVICE_NAME=yyyy
```

>If you don't have a Honeycomb account, you can sign up for a free trial [here](https://ui.honeycomb.io/signup).

### Visualize | OpenTelemetry
You will see the full OpenTelemetry execution tree organized as a DAG (if you provided credentials for HoneyComb/etc), allowing you to configure dashboards and alerts as the processes execute.

<img src="./img/opentelemetry.png" alt="Open Telemetry" style="width:600px;max-width:600px;">

### Visualize | RedisInsight
You can view the Redis streams and workflow execution by using RedisInsight.

<img src="./img/redisinsight.png" alt="Redis Insight" style="width:600px;max-width:600px;">

Every HotMesh workflow is a volley between worker and engine, driven by queue semantics:

<img src="./img/self_perpetuation.png" alt="Self Perpetuation" style="width:600px;max-width:600px;">


## Extend
Extend the examples by adding additional workflows. Three updates are needed to successfully deploy:
 * Add the new *workflow* to the `./services/meshos/` directory.
 * Register a new *worker* in `./web/service.ts`;
 * Register a new HTTP route in `./web/routes/test.ts`