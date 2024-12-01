# HotMesh Samples

This repo demonstrates the use of HotMesh in a JavaScript/TypeScript environment.  The [demos](./demos/) are structured to run like unit tests, and reveal the full lifecycle of a HotMesh transactional workflow.

The repo also includes a *Dashboard/WebApp* which surfaces all engines, workers, and workflows. The Web App provides a real-time view of the network's health and performance, linking to the OpenTelemetry dashboard for more detailed information. Refer to the [meshdata](./meshdata/) directory for details on the namespaces and entities surfaced in the example dashboard.

## Table of Contents
1. [Quickstart](#quickstart)
   - [Requirements](#requirements)
   - [Get started](#get-started)
   - [HotMesh Dashboard](#hotmesh-dashboard)
   - [JavaScript Lifecycle Demos](#javascript-lifecycle-demos)
   - [TypeScript Lifecycle Demos](#typescript-lifecycle-demos)
2. [Install](#install)
3. [Learn](#learn)
3. [MeshCall](#meshcall)
   - [Connect Everything](#connect-everything)
   - [Link the Cron Function](#link-the-cron-function)
   - [Run the Cron Function](#run-the-cron-function)
4. [MeshFlow](#meshflow)
   - [Transactional Workflow](#transactional-workflow)
   - [Activities](#activities)
   - [Workflows](#workflows)
   - [Client](#client)
   - [Worker](#worker)
5. [MeshData](#meshdata)
   - [Transactional Analytics](#transactional-analytics)
   - [Ad hoc Operational Networks](#ad-hoc-operational-networks)
   - [Connect](#connect)
   - [Execute](#execute)
   - [Execute and Cache](#execute-and-cache)
   - [Execute and Operationalize](#execute-and-operationalize)
6  [Connect](#connect)
   - [Postgres Client](#postgres-client)
   - [Postgres Pool](#postgres-pool)
   - [Redis](#redisioredis)
   - [NATS](#nats-pubsub)
6. [HotMesh](#hotmesh)
   - [Distributed Orchestration](#distributed-orchestration)
   - [Control Without a Controller](#control-without-a-controller)
   - [Model-driven Development](#model-driven-development)
7. [Run the Demos](#run-the-demos)
   - [JavaScript Examples](#javascript-examples)
   - [TypeScript Examples](#typescript-examples)
8. [Visualize | Open Telemetry](#visualize--opentelemetry)
9. [Visualize | Redis Insight](#visualize--redisinsight)
10. [Visualize | HotMesh Dashboard](#visualize--hotmesh-dashboard)

## Quickstart

### Requirements
- Docker (Desktop 4.24/Docker Compose 2.22.0)
- Node

### Get started
- `npm run docker:up` - Build
- `npm run docker:reset` - Reset All Databases / Clear All Data

HotMesh works with SQL/Postgres. Postgres is included in the docker-compose External Port mappings are:

- `5432` - Postgres

HotMesh works with any Redis-like backend. ValKey, DragonflyDB, and Redis are all included in the docker-compose. External Port mappings are:

- `6399` - Redis
- `6398` - ValKey
- `6397` - DragonflyDB

>All demos will work with all DB variants except for the MeshData demo which uses the Redis `FT.SEARCH` module (unsupported in ValKey). The demo will still successfully execute workflows, but it will not be searchable using `FT.SEARCH` commands.

### HotMesh Dashboard
The Dashboard Web App is available at `http://localhost:3010`. It provides a visual representation of the network, including the number of engines, workers, and workflows. It also provides a real-time view of the network's health and performance, linking to the OpenTelemetry dashboard for more detailed information.

An LLM is also included to simplify querying and analyzing workflow data for those deployments that include the Redis `FT.SEARCH` module.

All demos run against the redis backend, but can be configured to target others. For example: `DEMO_DB=postgres npm run docker:demo:js:hotmesh howdy`.

### JavaScript Lifecycle Demos
Run from outside the Docker container.
- `npm run docker:demo:js:hotmesh howdy` - Run the *HotMesh* lifecycle example (JavaScript)
- `npm run docker:demo:js:meshcall` - Run the *MeshCall* lifecycle example (JavaScript)
- `npm run docker:demo:js:meshflow` - Run the *MeshFlow* lifecycle example (JavaScript)
- `npm run docker:demo:js:meshdata bronze silver gold` - Run the *MeshData* lifecycle example (JavaScript)

### TypeScript Lifecycle Demos
Run from outside the Docker container.
- `npm run docker:demo:ts:hotmesh howdy` - Run the *HotMesh* lifecycle example (TypeScript)
- `npm run docker:demo:ts:meshcall` - Run the *MeshCall* lifecycle example (TypeScript)
- `npm run docker:demo:ts:meshflow` - Run the *MeshFlow* lifecycle example (TypeScript)
- `npm run docker:demo:ts:meshdata bronze silver gold` - Run the *MeshData* lifecycle example (TypeScript)

<br/>

## Install

```sh
npm install @hotmeshio/hotmesh
```

<br/>

## Learn
[🏠 Home](https://hotmesh.io/) | [📄 SDK Docs](https://hotmeshio.github.io/sdk-typescript/) | [💼 General Examples](https://github.com/hotmeshio/samples-typescript) | [💼 Temporal Examples](https://github.com/hotmeshio/temporal-patterns-typescript)

<br/>

## MeshCall
[MeshCall](https://hotmeshio.github.io/sdk-typescript/classes/services_meshcall.MeshCall.html) connects any function to the mesh

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Run an idempotent cron job <small>[more]</small></summary>

  ### Run a Cron
  This example demonstrates an *idempotent* cron that runs daily at midnight. The `id` makes each cron job unique and ensures that only one instance runs, despite repeated invocations. *The `cron` method returns `false` if a workflow is already running with the same `id`.*
  
  Optionally set a `delay` and/or set `maxCycles` to limit the number of cycles. The `interval` can be any human-readable time format (e.g., `1 day`, `2 hours`, `30 minutes`, etc) or a standard cron expression.

1. Define the cron function.
    ```typescript
    //cron.ts
    import { MeshCall } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    export const runMyCron = async (id: string, interval = '0 0 * * *'): Promise<boolean> => {
      return await MeshCall.cron({
        topic: 'my.cron.function',
        connection: {
          class: Postgres,
          options: {
            connectionString: 'postgresql://usr:pwd@localhost:5432/db'
          }
        },
        callback: async () => {
          //your code here...
        },
        options: { id, interval, maxCycles: 24 }
      });
    };
    ```

2. Call `runMyCron` at server startup (or call as needed to run multiple crons).
    ```typescript
    //server.ts
    import { runMyCron } from './cron';

    runMyCron('myNightlyCron123');
    ```
</details>

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Interrupt a cron job <small>[more]</small></summary>

  ### Interrupt a Cron
  This example demonstrates how to cancel a running cron job.

1. Use the same `id` and `topic` that were used to create the cron to cancel it.
    ```typescript
    import { MeshCall } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    MeshCall.interrupt({
      topic: 'my.cron.function',
      connection: {
        class: Postgres,
        options: {
          connectionString: 'postgresql://usr:pwd@localhost:5432/db'
        }
      },
      options: { id: 'myNightlyCron123' }
    });
    ```
</details>

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Call any function in any service <small>[more]</small></summary>

  ### Call a Function
  Make interservice calls that behave like HTTP but without the setup and performance overhead. This example demonstrates how to connect and call a function.

1. Call `MeshCall.connect` and provide a `topic` to uniquely identify the function.

    ```typescript
    //myFunctionWrapper.ts
    import { MeshCall, Types } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    export const connectMyFunction = async () => {
      return await MeshCall.connect({
        topic: 'my.demo.function',
        connection: {
          class: Postgres,
          options: {
            connectionString: 'postgresql://usr:pwd@localhost:5432/db'
          }
        },
        callback: async (input: string) => {
          //your code goes here; response must be JSON serializable
          return { hello: input }
        },
      });
    };
      ```

2. Call `connectMyFunction` at server startup to connect your function to the mesh.

    ```typescript
    //server.ts
    import { connectMyFunction } from './myFunctionWrapper';
    connectMyFunction();
    ```

3. Call your function from anywhere on the network (or even from the same service). Send any payload as long as it's JSON serializable.

    ```typescript
    import { MeshCall } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    const result = await MeshCall.exec({
      topic: 'my.demo.function',
      args: ['something'],
      connection: {
        class: Postgres,
        options: {
          connectionString: 'postgresql://usr:pwd@localhost:5432/db'
        }
      },
    }); //returns `{ hello: 'something'}`
    ```
</details>

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Call and <b>cache</b> a function <small>[more]</small></summary>

  ### Cache a Function
  This solution builds upon the previous example, caching the response. The linked function will only be re/called when the cached result expires. Everything remains the same, except the caller which specifies an `id` and `ttl`.

1. Make the call from another service (or even the same service). Include an `id` and `ttl` to cache the result for the specified duration.

    ```typescript
    import { MeshCall } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    const result = await MeshCall.exec({
      topic: 'my.demo.function',
      args: ['anything'],
      connection: {
        class: Postgres,
        options: {
          connectionString: 'postgresql://usr:pwd@localhost:5432/db'
        }
      },
      options: { id: 'myid123', ttl: '15 minutes' },
    }); //returns `{ hello: 'anything'}`
    ```

2. Flush the cache at any time, using the same `topic` and cache `id`.

    ```typescript
    import { MeshCall } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    await MeshCall.flush({
      topic: 'my.demo.function',
      connection: {
        class: Postgres,
        options: {
          connectionString: 'postgresql://usr:pwd@localhost:5432/db'
        }
      },
      options: { id: 'myid123' },
    });
    ```
</details>


<br/>

## MeshFlow
[MeshFlow](https://hotmeshio.github.io/sdk-typescript/classes/services_meshflow.MeshFlow.html) is a serverless replacement for *Temporal.io*

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Orchestrate unpredictable activities <small>[more]</small></summary>

### Proxy Activities
When an endpoint is unpredictable, use `proxyActivities`. HotMesh will retry as necessary until the call succeeds. This example demonstrates a workflow that greets a user in both English and Spanish. Even though both activities throw random errors, the workflow always returns a successful result.

1. Start by defining **activities**. Note how each throws an error 50% of the time.

    ```typescript
    //activities.ts
    export async function greet(name: string): Promise<string> {
      if (Math.random() > 0.5) throw new Error('Random error');
      return `Hello, ${name}!`;
    }

    export async function saludar(nombre: string): Promise<string> {
      if (Math.random() > 0.5) throw new Error('Random error');
      return `¡Hola, ${nombre}!`;
    }
    ```

2. Define the **workflow** logic. Include conditional branching, loops, etc to control activity execution. It's vanilla JavaScript written in your own coding style. The only requirement is to use `proxyActivities`, ensuring your activities are executed with HotMesh's durability wrapper.

    ```typescript
    //workflows.ts
    import { workflow } from '@hotmeshio/hotmesh';
    import * as activities from './activities';

    const { greet, saludar } = workflow
      .proxyActivities<typeof activities>({
        activities
      });

    export async function example(name: string): Promise<[string, string]> {
      return Promise.all([
        greet(name),
        saludar(name)
      ]);
    }
    ```

3. Instance a HotMesh **client** to invoke the workflow.

    ```typescript
    //client.ts
    import { Client, HotMesh } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    async function run(): Promise<string> {
      const client = new Client({
        connection: {
          class: Postgres,
          options: {
            connectionString: 'postgresql://usr:pwd@localhost:5432/db'
          }
        }
      });

      const handle = await client.workflow.start<[string,string]>({
        args: ['HotMesh'],
        taskQueue: 'default',
        workflowName: 'example',
        workflowId: HotMesh.guid()
      });

      return await handle.result();
      //returns ['Hello HotMesh', '¡Hola, HotMesh!']
    }
    ```

4. Finally, create a **worker** and link the workflow function. Workers listen for tasks on their assigned task queue and invoke the workflow function each time they receive an event.

    ```typescript
    //worker.ts
    import { worker } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';
    import * as workflows from './workflows';

    async function run() {
      const worker = await Worker.create({
        connection: {
          class: Postgres,
          options: {
            connectionString: 'postgresql://usr:pwd@localhost:5432/db'
          }
        },
        taskQueue: 'default',
        workflow: workflows.example,
      });

      await worker.run();
    }
    ```
</details>

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Pause and wait for a signal <small>[more]</small></summary>

### Wait for Signal
Pause a function and only awaken when a matching signal is received from the outide.

1. Define the **workflow** logic. This one waits for the `my-sig-nal` signal, returning the signal payload (`{ hello: 'world' }`) when it eventually arrives. Interleave additional logic to meet your use case.

    ```typescript
    //waitForWorkflow.ts
    import { workflow } from '@hotmeshio/hotmesh';

    export async function waitForExample(): Promise<{hello: string}> {
      return await workflow.waitFor<{hello: string}>('my-sig-nal');
      //continue processing, use the payload, etc...
    }
    ```

2. Instance a HotMesh **client** and start a workflow. Use a custom workflow ID (`myWorkflow123`).

    ```typescript
    //client.ts
    import { Client, HotMesh } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    async function run(): Promise<string> {
      const client = new Client({
        connection: {
          class: Postgres,
          options: {
            connectionString: 'postgresql://usr:pwd@localhost:5432/db'
          }
        }
      });

      //start a workflow; it will immediately pause
      await client.workflow.start({
        args: ['HotMesh'],
        taskQueue: 'default',
        workflowName: 'waitForExample',
        workflowId: 'myWorkflow123',
        await: false,
      });
    }
    ```

3. Create a **worker** and link the `waitForExample` workflow function.

    ```typescript
    //worker.ts
    import { Worker } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';
    import * as workflows from './waitForWorkflow';

    async function run() {
      const worker = await Worker.create({
        connection: {
          class: Postgres,
          options: {
            connectionString: 'postgresql://usr:pwd@localhost:5432/db'
          }
        },
        taskQueue: 'default',
        workflow: workflows.waitForExample,
      });

      await worker.run();
    }
    ```

4. Send a signal to awaken the paused function; await the function result.

    ```typescript
    import { Client } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    const client = new Client({
      connection: {
        class: Postgres,
        options: {
          connectionString: 'postgresql://usr:pwd@localhost:5432/db'
        }
      }
    });

    //awaken the function by sending a signal
    await client.signal('my-sig-nal', { hello: 'world' });

    //get the workflow handle and await the result
    const handle = await client.getHandle({
      taskQueue: 'default',
      workflowId: 'myWorkflow123'
    });
    
    const result = await handle.result();
    //returns { hello: 'world' }
    ```
</details>

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Wait for multiple signals (collation) <small>[more]</small></summary>

### Collate Multiple Signals
Use a standard `Promise` to collate and cache multiple signals. HotMesh will only awaken once **all** signals have arrived. HotMesh will track up to 25 concurrent signals.

1. Update the **workflow** logic to await two signals using a promise: `my-sig-nal-1` and `my-sig-nal-2`. Add additional logic to meet your use case.

    ```typescript
    //waitForWorkflows.ts
    import { workflow } from '@hotmeshio/hotmesh';

    export async function waitForExample(): Promise<[boolean, number]> {
      const [s1, s2] = await Promise.all([
        workflow.waitFor<boolean>('my-sig-nal-1'),
        workflow.waitFor<number>('my-sig-nal-2')
      ]);
      //do something with the signal payloads (s1, s2)
      return [s1, s2];
    }
    ```

2. Send **two** signals to awaken the paused function.

    ```typescript
    import { Client } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    const client = new Client({
      connection: {
        class: Postgres,
        options: {
          connectionString: 'postgresql://usr:pwd@localhost:5432/db'
        }
      }
    });

    //send 2 signals to awaken the function; order is unimportant
    await client.signal('my-sig-nal-2', 12345);
    await client.signal('my-sig-nal-1', true);

    //get the workflow handle and await the collated result
    const handle = await client.getHandle({
      taskQueue: 'default',
      workflowId: 'myWorkflow123'
    });
    
    const result = await handle.result();
    //returns [true, 12345]
    ```
</details>

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Create a recurring, cyclical workflow <small>[more]</small></summary>

### Cyclical Workflow
This example calls an activity and then sleeps for a week. It runs indefinitely until it's manually stopped. It takes advantage of durable execution and can safely sleep for months or years.

>Container restarts have no impact on actively executing workflows as all state is retained in the backend.

1. Define the **workflow** logic. This one calls a legacy `statusDiagnostic` function once a week.

    ```typescript
    //recurringWorkflow.ts
    import { workflow } from '@hotmeshio/hotmesh';
    import * as activities from './activities';

    const { statusDiagnostic } = workflow
      .proxyActivities<typeof activities>({
        activities
      });

    export async function recurringExample(someValue: number): Promise<void> {
      do {
        await statusDiagnostic(someValue);
      } while (await workflow.sleepFor('1 week'));
    }
    ```

2. Instance a HotMesh **client** and start a workflow. Assign a custom workflow ID (e.g., `myRecurring123`) if the workflow should be idempotent.

    ```typescript
    //client.ts
    import { Client, HotMesh } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    async function run(): Promise<string> {
      const client = new Client({
        connection: {
          class: Postgres,
          options: {
            connectionString: 'postgresql://usr:pwd@localhost:5432/db'
          }
        }
      });

      //start a workflow; it will immediately pause
      await client.workflow.start({
        args: [55],
        taskQueue: 'default',
        workflowName: 'recurringExample',
        workflowId: 'myRecurring123',
        await: false,
      });
    }
    ```

3. Create a **worker** and link the `recurringExample` workflow function.

    ```typescript
    //worker.ts
    import { Worker } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';
    import * as workflows from './recurringWorkflow';

    async function run() {
      const worker = await Worker.create({
        connection: {
          class: Postgres,
          options: {
            connectionString: 'postgresql://usr:pwd@localhost:5432/db'
          }
        },
        taskQueue: 'default',
        workflow: workflows.recurringExample,
      });

      await worker.run();
    }
    ```

4. Cancel the recurring workflow (`myRecurring123`) by calling `interrupt`.

    ```typescript
    import { Client } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    const client = new Client({
      connection: {
        class: Postgres,
        options: {
          connectionString: 'postgresql://usr:pwd@localhost:5432/db'
        }
      }
    });

    //get the workflow handle and interrupt it
    const handle = await client.getHandle({
      taskQueue: 'default',
      workflowId: 'myRecurring123'
    });
    
    const result = await handle.interrupt();
    ```
</details>

<br/>

## MeshData
[MeshData](https://hotmeshio.github.io/sdk-typescript/classes/services_meshdata.MeshData.html) adds analytics to running workflows

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Create a search index <small>[more]</small></summary>

### Workflow Data Indexes

This example demonstrates how to define a schema and deploy an index for a 'user' entity type.

1. Define the **schema** for the `user` entity. This one includes the 3 formats supported by the FT.SEARCH module: `TEXT`, `TAG` and `NUMERIC`.

    ```typescript
    //schema.ts
    export const schema: Types.WorkflowSearchOptions = {
      schema: {
        id: { type: 'TAG', sortable: false },
        first: { type: 'TEXT', sortable: false, nostem: true },
        active: { type: 'TAG', sortable: false },
        created: { type: 'NUMERIC', sortable: true },
      },
      index: 'user',
      prefix: ['user'],
    };
    ```

2. Create the index upon server startup. This one initializes the 'user' index, using the schema defined in the previous step. It's OK to call `createSearchIndex` multiple times; it will only create the index if it doesn't already exist.

    ```typescript
    //server.ts
    import { MeshData } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';
    import { schema } from './schema';

    const meshData = new MeshData({
        class: Postgres,
        options: {
          connectionString: 'postgresql://usr:pwd@localhost:5432/db'
        }
      },
      schema,
    );
    await meshData.createSearchIndex('user', { namespace: 'meshdata' });
    ```
</details>

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Create an indexed, searchable record <small>[more]</small></summary>

### Workflow Record Data
This example demonstrates how to create a 'user' workflow backed by the searchable schema from the prior example.

1. Call MeshData `connect` to initialize a 'user' entity *worker*. It references a target worker function which will run the workflow. Data fields that are documented in the schema (like `active`) will be automatically indexed when set on the workflow record.

    ```typescript
    //connect.ts
    import { MeshData } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';
    import { schema } from './schema';

    export const connectUserWorker = async (): Promise<void> => {
      const meshData = new MeshData(
        {
          class: Postgres,
          options: {
            connectionString: 'postgresql://  usr:pwd@localhost:5432/db'
          }
        },
        schema,
      );
    
      await meshData.connect({
        entity: 'user',
        target: async function(name: string): Promise<string> {
          //add custom, searchable data (`active`) and return
          const search = await MeshData.workflow.search();
          await search.set('active', 'yes');
          return `Welcome, ${name}.`;
        },
        options: { namespace: 'meshdata' },
      });
    }
    ```

2. Wire up the worker at server startup, so it's ready to process incoming requests.

    ```typescript
    //server.ts
    import { connectUserWorker } from './connect';
    await connectUserWorker();
    ```

3. Call MeshData `exec` to create a 'user' workflow. Searchable data can be set throughout the workflow's lifecycle. This one initializes the workflow with 3 data fields: `id`, `name` and `timestamp`. *An additional data field (`active`) is set within the workflow function in order to demonstrate both mechanisms for reading/writing data to a workflow.*
  
    ```typescript
    //exec.ts
    import { MeshData } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';

    const meshData = new MeshData(
      {
        class: Postgres,
        options: {
          connectionString: 'postgresql://usr:pwd@localhost:5432/db'
        }
      },
      schema,
    );

    export const newUser = async (id: string, name: string): Promise<string> => {
      const response = await meshData.exec({
        entity: 'user',
        args: [name],
        options: {
          ttl: 'infinity',
          id,
          search: {
            data: { id, name, timestamp: Date.now() }
          },
          namespace: 'meshdata',
        },
      });
      return response;
    };
    ```

4. Call the `newUser` function to create a searchable 'user' record.

    ```typescript
    import { newUser } from './exec';
    const response = await newUser('jim123', 'James');
    ```
</details>

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Fetch record data <small>[more]</small></summary>

### Read Record Data
This example demonstrates how to read data fields directly from a workflow.

1. Read data fields directly from the *jimbo123* 'user' record.

    ```typescript
    //read.ts
    import { MeshData } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';
    import { schema } from './schema';

    const meshData = new MeshData(
      {
        class: Postgres,
        options: {
          connectionString: 'postgresql://usr:pwd@localhost:5432/db'
        }
      },
      schema,
    );

    const data = await meshData.get(
      'user',
      'jimbo123',
      { 
        fields: ['id', 'name', 'timestamp', 'active'],
        namespace: 'meshdata'
      },
    );
    ```
</details> 

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Search record data <small>[more]</small></summary>

### Query Record Data
This example demonstrates how to search for those workflows where a given condition exists in the data. This one searches for active users. *NOTE: The native Redis FT.SEARCH syntax and SQL are currently supported. The JSON abstraction shown here is a convenience method for straight-forward, one-dimensional queries.*

1. Search for active users (where the value of the `active` field is `yes`).

    ```typescript
    //read.ts
    import { MeshData } from '@hotmeshio/hotmesh';
    import { Client as Postgres } from 'pg';
    import { schema } from './schema';

    const meshData = new MeshData(
      {
        class: Postgres,
        options: {
          connectionString: 'postgresql://usr:pwd@localhost:5432/db'
        }
      },
      schema,
    );

    const results = await meshData.findWhere('user', {
      query: [{ field: 'active', is: '=', value: 'yes' }],
      limit: { start: 0, size: 100 },
      return: ['id', 'name', 'timestamp', 'active']
    });
    ```
</details> 

<br/>

## Connect
HotMesh is pluggable and ships with support for **Postgres** (pg) and **Redis** (ioredis/redis). **NATS** is also supported for extended PubSub  (patterned subscriptions).

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Postgres <small>[more]</small></summary>

### Postgres Client
```typescript
import { Client as PostgresClient } from 'pg';

//provide these credentials to HotMesh
const connection = {
  class: PostgresClient,
  options: {
    connectionString: 'postgresql://usr:pwd@localhost:5432/db'
  }
};

```
### Postgres Pool
Pool connections are recommended for high-throughput applications. The pool will manage connections and automatically handle connection pooling.
```typescript
import { Pool as PostgresPool } from 'pg';

const PostgresPoolClient = new PostgresPool({
  connectionString: 'postgresql://usr:pwd@localhost:5432/db'
});

//provide these credentials to HotMesh
const connection = {
  class: PostgresPoolClient,
  options: {}
};
```

</details>

<details style="padding: .5em">
  <summary style="font-size:1.25em;">Redis <small>[more]</small></summary>

### Redis/IORedis
```typescript
import * as Redis from 'redis';
//OR `import Redis from 'ioredis';`

const connection = {
  class: Redis,
  options: {
    url: 'redis://:your_password@localhost:6379',
  }
};
```
</details>

<details style="padding: .5em">
  <summary style="font-size:1.25em;">NATS <small>[more]</small></summary>

### NATS PubSub
Add NATS for improved PubSub support, including patterned subscriptions. Note the explicit channel subscription in the example below. *The NATS provider supports version 2.0 of the NATS client (the latest version). See ./package.json for details.*

```typescript
import { Client as Postgres } from 'pg';
import { connect as NATS } from 'nats';

const connection = {
  store: {
    class: Postgres,
    options: {
      connectionString: 'postgresql://usr:pwd@localhost:5432/db',
    }
  },
  stream: {
    class: Postgres,
    options: {
      connectionString: 'postgresql://usr:pwd@localhost:5432/db',
    }
  },
  sub: {
    class: NATS,
    options: { servers: ['nats:4222'] }
  },
};
```
</details>

<br/>

## HotMesh Platform Overview
### Distributed Orchestration
[HotMesh](https://hotmeshio.github.io/sdk-typescript/classes/services_hotmesh.HotMesh.html) is a distributed modeling and orchestration system capable of encapsulating existing systems, such as Business Process Management (BPM) and Enterprise Application Integration (EAI). The central innovation is its ability to compile its models into Distributed Executables, replacing a traditional Application Server with a network of Decentralized Message Routers.

The following depicts the mechanics of the approach and describes what is essentially a *sequence engine*. Time is an event source in the system, while sequence is the final arbiter. This allows the system to use Redis (or a Redis clone such as ValKey) like a balloon, flexibly expanding and deflating as the network adjusts to its evolving workload.

<img src="./docs/img/stream_driven_workflow.png" alt="A stream-driven workflow engine" style="max-width:100%;width:800px;">

The modeling system is based on a [canonical set](https://zenodo.org/records/12168558) of 9 message types (and corresponding transitions) that guarantee the coordinated flow in the absence of a central controller.

<img src="./docs/img/hotmesh_canonical_types.png" alt="HotMesh Canonical Message and Transition types" style="max-width:100%;width:800px;">

Here, for example, is the `worker` activity type. It's reentrant (most activities are), which allows your linked functions to emit in-process messages as they complete a task. The messaging system goes beyond basic request/response and fan-out/fan-in patterns, providing real-time progress updates.

<img src="./docs/img/worker_activity_and_transitions.png" alt="HotMesh Canonical Worker type" style="max-width:100%;width:800px;">

>Process orchestration is emergent within HotMesh and occurs naturally as a result of processing stream messages. While the reference implementation targets Redis+TypeScript, any language (Rust, Go, Python, Java) and multimodal database (ValKey, DragonFly, etc) can take advantage of the *sequence engine* design pattern.

<br/>

### Control Without a Controller
HotMesh is designed as a distributed quorum of engines where each member adheres to the principles of CQRS. According to CQRS, *consumers* are instructed to read events from assigned topic queues while *producers* write to said queues. This division of labor is essential to the smooth running of the system. HotMesh leverages this principle to drive the perpetual behavior of engines and workers (along with other advantages described [here](https://github.com/hotmeshio/sdk-typescript/blob/main/docs/distributed_orchestration.md)). 

As long as their assigned topic queue has items, consumers will read exactly one item and then journal the result to another queue. And as long as all consumers (engines and workers) adhere to this principle, sophisticated workflows emerge.

<br/>

### Model-driven Development
The following YAML represents a HotMesh workflow; it includes a *trigger* and a linked *worker* function. The Sequence Engine will step through these instructions one step at a time once deployed.

```yaml
# myfirstapp.1.yaml
app:
  id: myfirstapp
  version: '1'
  graphs:
    - subscribes: myfirstapp.test
      activities:
        t1:
          type: trigger
        w1:
          type: worker
          topic: work.do
      transitions:
        t1:
          - to: w1
```

>The `work.do` *topic* identifies the worker function to execute. This name is arbitrary and should match the semantics of your use case or your own personal preference.

Call `HotMesh.init` to register a *worker* and *engine*. As HotMesh is a distributed orchestration platform, initializing a point of presence like this serves to give the engine another distributed node. If spare CPU is available on the host machine, the *engine role* will be called upon to coordinate the overall workflow. Similarly, invoking the linked worker function, involves the *worker role*.

```javascript
import * as Redis from 'redis';
import { HotMesh } from '@hotmeshio/hotmesh';

const hotMesh = await HotMesh.init({
  appId: 'myfirstapp',

  engine: {
    connection: {
      class: Redis,
      options: { url: 'redis://:key_admin@redis:6379' }
    }
  },

  workers: [
    { 
      topic: 'work.do',
      connection: {
        class: Redis,
        options: { url: 'redis://:key_admin@redis:6379' }
      }
      callback: async (data: StreamData) => {
        return {
          metadata: { ...data.metadata },
          data: { } //optionally process inputs, return output
        };
      }
    }
  ]
});

await hotMesh.deploy('./myfirstapp.1.yaml');
await hotMesh.activate('1');
const response = await hotMesh.pubsub('myfirstapp.test', {});
//returns {}
```

<br/>

## Run the Demos
Redis is the default test runner for the demos, but you can specify any target backend (valkey, redis, dragonfly, postgres). For example, `DEMO_DB=postgres npm run demo:js:hotmesh greetings`.

### JavaScript Examples

#### Run/Demo HotMesh (JavaScript)
This demo deploys a custom YAML model and a linked worker function to demonstrate the full end-to-end lifecycle.
From within the container:
```bash
npm run demo:js:hotmesh greetings
```
From outside the container:
```bash
npm run docker:demo:js:hotmesh greetings
```

#### Run/Demo MeshCall (JavaScript)
This demo shows interservice function calls with caching support.
From within the container:
```bash
npm run demo:js:meshcall
```
From outside the container:
```bash
npm run docker:demo:js:meshcall
```
#### Run/Demo MeshFlow (JavaScript)
This demo shows a basic durable workflow with support for *retry*. It throws errors 50% of the time and eventually recovers, logging the result of the workflow execution to the log. The retry cycle is set at 5 seconds.
From within the container:
```bash
npm run demo:js:meshflow
```
From outside the container:
```bash
npm run docker:demo:js:meshflow
```

#### Run/Demo MeshData (JavaScript)
This demo runs a few workflows (one for every term you add when starting the test). The app auto-deploys, creates an index, and searches for workflow records based upon terms. The following will create 3 searchable workflows: bronze, silver, gold. The last term entered will be used to drive the FT.SEARCH query. (The following would search for the 'gold' record after all workflows (bronze, silver, and gold) have started.)
From within the container:
```bash
npm run demo:js:meshdata bronze silver gold
```
From outside the container:
```bash
npm run docker:demo:js:meshdata bronze silver gold
```

### TypeScript Examples

#### Run/Demo HotMesh (TypeScript)
This demo deploys a custom YAML model and a linked worker function to demonstrate the full end-to-end lifecycle.
From within the container:
```bash
npm run demo:ts:hotmesh greetings
```
From outside the container:
```bash
npm run docker:demo:ts:hotmesh greetings
```

#### Run/Demo MeshCall (TypeScript)
This demo shows interservice function calls with caching support.
From within the container:
```bash
npm run demo:ts:meshcall
```
From outside the container:
```bash
npm run docker:demo:ts:meshcall
```

#### Run/Demo MeshFlow (TypeScript)
This demo shows a basic durable workflow with support for *retry*. It throws errors 50% of the time and eventually recovers, logging the result of the workflow execution to the log. The retry cycle is set at 5 seconds.
From within the container:
```bash
npm run demo:ts:meshflow
```
From outside the container:
```bash
npm run docker:demo:ts:meshflow
```

#### Run/Demo MeshData (TypeScript)
This demo runs a few workflows (one for every term you add when starting the test). The app auto-deploys, creates an index, and searches for workflow records based upon terms. The following will create 3 searchable workflows: bronze, silver, gold. The last term entered will be used to drive the FT.SEARCH query. (The following would search for the 'gold' record after all workflows (bronze, silver, and gold) have started.)
From within the container:
```bash
npm run demo:ts:meshdata bronze silver gold
```
From outside the container:
```bash
npm run docker:demo:ts:meshdata bronze silver gold
```

## Visualize | OpenTelemetry
Add your Honeycomb credentials to `.env`, and view the full *OpenTelemetry* execution tree organized as a DAG.

<img src="./docs/img/opentelemetry.png" alt="Open Telemetry" style="width:600px;max-width:600px;">

## Visualize | RedisInsight
View commands, streams, data, etc using RedisInsight.

<img src="./docs/img/redisinsight.png" alt="Redis Insight" style="width:600px;max-width:600px;">

## Visualize | HotMesh Dashboard
The HotMesh dashboard provides a visual representation of the network, including the number of engines, workers, and workflows. It also provides a real-time view of the network's health and performance, linking to the OpenTelemetry dashboard for more detailed information.

An LLM is also included to simplify querying and analyzing workflow data for those deployments that include the Redis `FT.SEARCH` module.

<img src="./docs/img/hotmesh_dashboard.png" alt="HotMesh Dashboard" style="width:600px;max-width:600px;">
