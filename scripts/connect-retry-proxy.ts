import { createServer, type IncomingMessage } from 'node:http';
import { connect, type Socket } from 'node:net';
import type { Duplex } from 'node:stream';

// Local HTTP CONNECT proxy for the staging suite. Chromium opens its TLS
// connection to staging through this tunnel; the proxy only re-dials the origin
// with a fresh socket (new source port) when a TCP handshake is never answered.
// TLS stays end-to-end: the proxy never sees request or response bytes.

const host = '127.0.0.1';
const port = Number(process.env.STAGING_PROXY_PORT ?? '43989');
const allowedHost = process.env.STAGING_PROXY_ALLOWED_HOST ?? 'staging.zvenfit.ru';
const attempts = Number(process.env.STAGING_PROXY_ATTEMPTS ?? '8');
const connectTimeoutMs = Number(process.env.STAGING_PROXY_CONNECT_TIMEOUT_MS ?? '2500');

if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
  throw new Error('STAGING_PROXY_PORT must be an integer between 1024 and 65535');
}
if (!Number.isInteger(attempts) || attempts < 1 || attempts > 20) {
  throw new Error('STAGING_PROXY_ATTEMPTS must be an integer between 1 and 20');
}
if (!Number.isInteger(connectTimeoutMs) || connectTimeoutMs < 100 || connectTimeoutMs > 30_000) {
  throw new Error('STAGING_PROXY_CONNECT_TIMEOUT_MS must be an integer between 100 and 30000');
}

function dial(targetHost: string, targetPort: number): Promise<{ socket: Socket; attempt: number }> {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const tryOnce = (): void => {
      attempt += 1;
      const socket = connect({ host: targetHost, port: targetPort });
      const timer = setTimeout(() => {
        socket.destroy(new Error(`no TCP handshake within ${connectTimeoutMs} ms`));
      }, connectTimeoutMs);
      const onError = (error: Error): void => {
        clearTimeout(timer);
        socket.destroy();
        if (attempt < attempts) {
          tryOnce();
        } else {
          reject(error);
        }
      };

      socket.once('error', onError);
      socket.once('connect', () => {
        clearTimeout(timer);
        socket.off('error', onError);
        socket.setNoDelay(true);
        resolve({ socket, attempt });
      });
    };

    tryOnce();
  });
}

const server = createServer((_request, response) => {
  response.writeHead(405, { Allow: 'CONNECT' });
  response.end();
});

server.on('connect', (request: IncomingMessage, clientSocket: Duplex, head: Buffer) => {
  const target = new URL(`http://${request.url ?? ''}`);
  const targetHost = target.hostname;
  const targetPort = Number(target.port || '443');

  if (targetHost !== allowedHost || targetPort !== 443) {
    console.log(`[staging-proxy] refused CONNECT to ${targetHost}:${targetPort}`);
    clientSocket.end('HTTP/1.1 403 Forbidden\r\n\r\n');
    return;
  }

  dial(targetHost, targetPort)
    .then(({ socket, attempt }) => {
      if (attempt > 1) {
        console.log(`[staging-proxy] tunnel to ${targetHost} needed ${attempt} TCP attempts`);
      }
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length > 0) {
        socket.write(head);
      }
      socket.pipe(clientSocket);
      clientSocket.pipe(socket);
      socket.on('error', () => clientSocket.destroy());
      socket.on('close', () => clientSocket.destroy());
      clientSocket.on('error', () => socket.destroy());
      clientSocket.on('close', () => socket.destroy());
    })
    .catch((error: Error) => {
      console.log(`[staging-proxy] ${targetHost}: no connection after ${attempts} attempts (${error.message})`);
      clientSocket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n');
    });
});

server.listen(port, host, () => {
  console.log(
    `[staging-proxy] listening on http://${host}:${port}, tunnels only to ${allowedHost}:443, up to ${attempts} TCP attempts`,
  );
});
