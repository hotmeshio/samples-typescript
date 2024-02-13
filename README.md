# HotMesh TypeScript Examples
This repo demonstrates the use of HotMesh in a TypeScript environment. The examples shown are traditional TypeScript functions. But they are run as **reentrant processes** and are executed in a distributed environment, with all the benefits of a distributed system, including fault tolerance, scalability, and high availability.

## Docker-Compose
The docker-compose configuration spins up **two** Node instances and 1 Redis instance (on port 6371). Workflows run on both as the workloads are distributed.

## Build
The application includes a docker-compose file that spins up one Redis instance and two Node instances. To build the application, run the following command:

```bash
docker-compose up --build -d
```

>The Node instance initializes a Fastify HTTP server on port `3002` and starts the various workers needed for the demo.

## Run/Test
Open an HTTP test client to invoke the API endpoints for the `User` and `Bill` entities. For example, create a new user by sending a POST request to `http://localhost:3002/v1/users` with a JSON payload. A user will be created along with a recurring, transactional bill (a hook) that is designed to execute a bill run every 1 minute.

The `User` and `Bill` entities are indexed and searchable in Redis. Query for users by sending a POST request with an advanced query to `http://localhost:3002/v1/users/SEARCH` or get a user by ID: `http://localhost:3002/v1/users/:id.

All HTTP routes are defined in `./web/routes.ts` while business logic for the User and Bill classes is defined in `./services/pluck/user/index.ts` and `./services/pluck/bill/index.ts` respectively.

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