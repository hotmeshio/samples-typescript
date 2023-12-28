# HotMesh TypeScript Examples
This repo demonstrates the use of HotMesh in a TypeScript environment. The examples shown are traditional TypeScript functions. But they are run as **reentrant processes** and are executed in a distributed environment, with all the benefits of a distributed system, including fault tolerance, scalability, and high availability.

With HotMesh, all state-related code is managed by Redis. Write functions in your own preferred style, and HotMesh will handle the function governance and execution. Consider the [retry](services/meshos/retry/index.ts) example that is executed as a workflow:

```typescript
class MyRetryClass extends MeshOS {

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
```

If you invoke the function as a vanilla NodeJS function, it will execute as usual governed by NodeJS, *and it will fail 50% of the time*.

```typescript
await new MyRetryClass().retryMe('World');
//<Error: `Please retry`> OR `Hello Retry World!` 🤷
```

But if you provide a workflow GUID, HotMesh will intercept the call and distribute it as a durable workflow across your microservices. Your function might throw some errors along the way, but it will eventually succeed.

```typescript
await new MyRetryClass({ id: 'myguid', await: true }).retryMe('World');
//`Hello Retry World!`
```

## Repository Overview

This repository is a compilation of examples demonstrating the use of `HotMesh`. Refer to the [/meshos directory](/services/meshos/) for usage examples, including: `executeChild`, `startChild`, `hook`, `signal`, `waitForSignal`, `proxyActivity`, `sleep`, `random`, `get`, `set`, `incr`, etc. 

A critical step in the deployment process is starting and stopping your workers. This is typically done when you start and stop your microservices container. Refer to the [services.ts](./web/service.ts) module for an example of how to *start* and *stop* workers.

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