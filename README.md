# HotMesh TypeScript Examples

This repo demonstrates the use of HotMesh in a TypeScript environment. The examples shown are traditional TypeScript functions. But they are run as **reentrant processes** and are executed in a distributed environment, with all the benefits of a distributed system, including fault tolerance, scalability, and high availability.

All state-related code is managed by Redis. Write functions in your own preferred style, and HotMesh will handle the function execution.

## Understanding State Management

As engineers, we're constantly navigating state. Let's consider a simple function that adds numbers:

```typescript
function addNumbers(a: number, b: number): number {
  const sum = a + b;
  return sum;
}
```

In this snippet, there's state management between each line as the computer processes the operations. While the risk of state inconsistencies in pure functions like this is negligible, the complexity escalates when we interact with other services (even other  microservices within the same VPC). This is where state management enters our consciousness as engineers. We might not quantify it directly, but our cumulative experience manifests in an ever-growing collection of try/catch blocks and state-related glue code, a testament to our efforts in mitigating state risks.

## Repository Overview

This repository is a compilation of examples demonstrating the use of `HotMesh`. These examples are not just code snippets; they are a narrative of how addressing state can lead to more robust and maintainable software.

### The 'Sleep' Workflow

One of the simplest examples to illustrate this principal is the 'sleep' workflow. This workflow illustrates how a system can pause for an extended period (months or years!) and then resume seamlessly. The design ensures that the function doesn't remain active during this period. Instead, Redis will send a message to the stream when it's time to awaken.

```typescript
import { Durable } from '@hotmeshio/hotmesh';
import * as activities from './activities';

const { hi, bye } = Durable.workflow.proxyActivities<typeof activities>({ activities });

export async function sleepExample(name: string): Promise<string[]> {
  const response1 = await hi(name);
  await Durable.workflow.sleep('1 week');
  const response2 = await bye(name);

  return [response1, response2];
}
```

Critically, the `hi` function only executes *once*, and the value is memoized by Redis. After 1 week, the function will awaken and use cached data from the previous execution (from last week).

### The 'Wait' Workflow

The `wait` workflow demonstrates HotMesh's ability to respond to external triggers. The workflow remains idle, awaiting two specific signals before proceeding. This example is particularly useful for understanding how HotMesh can incorporate asynchronous events and external dependencies.

Find the workflow defined in `./services/durable/wait/workflows.ts`:

```typescript
import { Durable } from '@hotmeshio/hotmesh';
import * as activities from '../sleep/activities';

const { hi, bye } = Durable.workflow.proxyActivities<typeof activities>({ activities });

export async function waitExample(name: string): Promise<any[]> {
  const response1 = await hi(name);
  const [abc, xyz] = await Durable.workflow.waitForSignal(['abc', 'xyz']);
  const response2 = await bye(name);

  return [response1, response2, abc, xyz];
} 
```

As before, the `hi` function in this example only executes once and the value is memoized by Redis. After both signals `abc` and `xyz` are received, the function will awaken and use cached data from the previous execution. It does not matter the order in which the signals are received. The workflow will not proceed until both signals are received, providing *signal event collation* without all the glue code.

#### Executing the 'Wait' Workflow

1. **Initiate the Workflow**: Start the `wait` workflow by navigating to `http://localhost:3002/apis/v1/test/wait` in your browser or through an HTTP client. The workflow will pause, waiting for the necessary signals.

2. **Send the Signals**: While the initial call is paused, send the required signals to the workflow. Use another HTTP client or browser window to send signals to `http://localhost:3002/apis/v1/signal/abc` and `http://localhost:3002/apis/v1/signal/xyz`.

>You can send any object type when sending a signal. The signal will be stored in Redis and retrieved by the workflow when it resumes in the order defined in your function code.

```typescript
//initialize the HotMesh Durable client
//...

//send the signal
durableClient.workflow.signal(signalId, payload);
```

### The 'Retry' Workflow
Workflow functions are designed to re-run until they succeed. It is possible to throw a fatal error that will truly stop a workflow (`DurableFatalError`), but in general the workflow will retry an action until it succeeds. The [retry](./services/durable/retry/workflows.ts) example includes an activity that throws random errors. Increase the threshold to 99%, and the workflow will still succeed (although that might happen some time next week).

```typescript
export async function unpredictableFunction(name: string): Promise<string> {
  if (Math.random() < 0.5) {
    throw new Error('Random error');
  }
  return `Hello, ${name}!`;
}
```

The workflow code includes no affordances for retrying this function. Instead of coming up with an endless laundry list of everything that might go wrong and then writing try/catch statements to handle each scenario, you can just write the code that you want to execute and let HotMesh handle the retries. Add limits like *backoff* and *max retries* as desired, but the default is to retry until it succeeds.

```typescript
import { Durable } from '@hotmeshio/hotmesh';
import * as activities from './activities';

const { unpredictableFunction } = Durable.workflow.proxyActivities<typeof activities>({ activities });

export async function retryExample(name: string): Promise<string> {
  return await unpredictableFunction(name);
}
```

### Search and Query
HotMesh provides a mechanism for storing and retrieving workflow state.

```typescript
import { Durable } from '@hotmeshio/hotmesh';
import * as activities from './activities';

const { hi, bye } = Durable.workflow.proxyActivities<typeof activities>({ activities });

export async function stateExample(name: string): Promise<string[]> {
  const response1 = await hi(name);

  //init the durable search client; bind searchable data to the workflow
  const search = await Durable.workflow.search();

  //save any arbitrary term
  await search.set('hi', response1);

  //increment a counter
  await search.incr('counter', 11);

  //change values to indicate workflow state
  await search.set('sleeping', 'true');
  await Durable.workflow.sleep('90 seconds');
  await search.set('sleeping', 'false');

  return [response1, await search.get('hi'), await search.get('sleeping')];
}
```

## Docker-Compose

The docker-compose configuration spins up **two** Node instances and 1 Redis instance (on port 6371). The Node instances start different durable workers.

## Build
The application includes a docker-compose file that spins up one Redis instance and two Node instances. To build the application, run the following command:

```bash
docker-compose up --build -d
```

>The Node instance initializes a Fastify HTTP server on port `3002` and starts the various durable workers needed for the demo.

## Run
Open a browser and navigate to `http://localhost:3002/apis/v1/test/helloworld` to invoke the `helloworld` workflow. Additional workflows can be tested by invoking them in the same manner (e.g., `v1/test/helloworld`, `v1/test/child`, `v1/test/parent`, `v1/test/looper`, `v1/test/remote`, `v1/test/retry`, `v1/test/saludar`, `v1/test/sleep`).

## Telemetry Keys
*Optionally*, add a `.env` file to the project root and include your keys for honeycomb open telemetry if you wish to use the default tracer configuration located in `./services/tracer.ts`. The following keys are required to enable the default tracer in this project (but you can add your own tracer configuration and supporting keys if you use a different OpenTelemetry provider).

```
HONEYCOMB_API_KEY=XXXXXXXXXX
OTEL_SERVICE_NAME=yyyy
```

>If you don't have a Honeycomb account, you can sign up for a free trial [here](https://ui.honeycomb.io/signup).

### Visualize | OpenTelemetry
You will see the full OpenTelemetry execution tree organized as a DAG (if you provided credentials for HoneyComb/etc), allowing you to configure dashboards and alerts as the processes execute. The following graph represents the execution of the `looper` workflow. That worflow includes two *sequential* activity calls (`proxyActivity`) and three nested *parallel* workflow calls (`executeChild`). The times shown are the total execution time for each node in the graph. Every node in the graph is a separate span in the OpenTelemetry trace and can be expanded for more detail about the subprocess.

<img src="./img/opentelemetry.png" alt="Open Telemetry" style="width:600px;max-width:600px;">

### Visualize | RedisInsight
You can view the Redis streams and workflow execution by using RedisInsight. The following image shows the RedisInsight dashboard for the `looper` workflow. HotMesh collocates version, data, and execution instructions to Redis, allowing you full visibility into the journaled data.

<img src="./img/redisinsight.png" alt="Redis Insight" style="width:600px;max-width:600px;">

The above image reflects the *initiation* of a HotMesh workflow (HSETNX). Workflows execute and complete without any outside input (aside from the initial request). All other activities are driven by queue semantics, leveraging Redis Streams to guarantee a cascading chain of activities, through the simple act of reading from one queue and writing to another.

The following image reflects the essence of every HotMesh workflow, namely, a volley between worker and engine, driven by queue semantics:

<img src="./img/self_perpetuation.png" alt="Self Perpetuation" style="width:600px;max-width:600px;">


## Extend
Extend the examples by adding additional workflows. Three updates are needed to successfully deploy:
 * Add the new *workflow* to the `./services/durable/` directory.
 * Register a new *worker* in `./web/service.ts`;
 * Register a new HTTP route in `./web/routes/test.ts`