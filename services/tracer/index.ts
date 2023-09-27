// import { trace } from "@opentelemetry/api";
// import { BatchSpanProcessor, ConsoleSpanExporter, BasicTracerProvider } from "@opentelemetry/sdk-trace-base";
// import { Resource } from "@opentelemetry/resources";
// import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
// import { registerInstrumentations } from "@opentelemetry/instrumentation";

// import packageJson from '../../package.json';

// export const setupTelemetry = (enableTelemetryConsoleLogger: boolean = false) => {

//   registerInstrumentations({
//     instrumentations: [],
//   });

//   const resource =
//     Resource.default().merge(
//       new Resource({
//         [SemanticResourceAttributes.SERVICE_NAME]: packageJson.name,
//         [SemanticResourceAttributes.SERVICE_VERSION]: packageJson.version,
//       })
//     );

//   const provider = new BasicTracerProvider({ resource });
//   if (enableTelemetryConsoleLogger) {
//     provider.addSpanProcessor(new BatchSpanProcessor(new ConsoleSpanExporter(), {
//       scheduledDelayMillis: 1000,
//       maxExportBatchSize: 1000,
//       maxQueueSize: Infinity,
//     }));
//     provider.register();
//   }
//   trace.getTracer(packageJson.name, packageJson.version);
// }

import { NodeSDK } from '@opentelemetry/sdk-node';
import { HoneycombSDK } from '@honeycombio/opentelemetry-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
export const setupTelemetry = () => {
  if (process.env.HONEYCOMB_API_KEY && process.env.OTEL_SERVICE_NAME) {
    // Uses environment variables named HONEYCOMB_API_KEY and OTEL_SERVICE_NAME
    // @ts-ignore
    const sdk: NodeSDK = new HoneycombSDK({
      instrumentations: [    
        getNodeAutoInstrumentations({
          // disable fs automatic instrumentation because 
          // it can be noisy and expensive during startup
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
      ],
    });
    sdk.start();
  } else {
    console.log('Honeycomb API key or OTEL_SERVICE_NAME not found. Skipping telemetry setup.');
  }
};
