'use strict';

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { ConsoleSpanExporter, BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const api = require('@opentelemetry/api');

const otlpExporter = new OTLPTraceExporter({
});

const consoleExporter = new ConsoleSpanExporter();

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'auth-api-service',
  }),
  
  spanProcessors: [
    new BatchSpanProcessor(otlpExporter),
    new BatchSpanProcessor(consoleExporter) 
  ],
  
  instrumentations: [getNodeAutoInstrumentations()],
});

try {
  sdk.start();
  console.log('OpenTelemetry tracing initialized');
  
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

} catch (error) {
  console.error('Error initializing OpenTelemetry', error);
  process.exit(1);
}

module.exports = api;