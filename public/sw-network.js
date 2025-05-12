// Network condition simulation
import { log } from './sw-logging.js';

let networkConditions = {
  latency: 0,
  downloadThroughput: Infinity,
  uploadThroughput: Infinity,
  offline: false
};

export function initializeNetworkSimulation() {
  log('info', 'Initializing network simulation');
  return Promise.resolve();
}

export function setNetworkConditions(conditions) {
  networkConditions = {
    ...networkConditions,
    ...conditions
  };
  log('info', 'Network conditions updated:', networkConditions);
}

export function simulateNetworkConditions(request) {
  if (networkConditions.offline) {
    return Promise.reject(new Error('Network is offline'));
  }

  return new Promise((resolve, reject) => {
    // Simulate latency
    setTimeout(() => {
      fetch(request)
        .then(response => {
          // Simulate throughput limitations
          if (response.body && networkConditions.downloadThroughput < Infinity) {
            // Implementation of throttled response
            const reader = response.body.getReader();
            const stream = new ReadableStream({
              async start(controller) {
                while (true) {
                  const {done, value} = await reader.read();
                  if (done) break;
                  
                  // Calculate delay based on throughput
                  const delay = (value.length * 8) / networkConditions.downloadThroughput * 1000;
                  await new Promise(r => setTimeout(r, delay));
                  
                  controller.enqueue(value);
                }
                controller.close();
              }
            });
            
            resolve(new Response(stream, {
              headers: response.headers,
              status: response.status,
              statusText: response.statusText
            }));
          } else {
            resolve(response);
          }
        })
        .catch(reject);
    }, networkConditions.latency);
  });
}
