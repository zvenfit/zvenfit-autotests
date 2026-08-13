import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const host = '127.0.0.1';
const port = Number(process.env.ZVENFIT_TEST_PORT ?? '43987');

if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
  throw new Error('ZVENFIT_TEST_PORT must be an integer between 1024 and 65535');
}
const frontendRoot = process.env.ZVENFIT_FRONTEND_PATH
  ? path.resolve(process.env.ZVENFIT_FRONTEND_PATH)
  : path.resolve(process.cwd(), '../zvenfit-frontend');
const siteRoot = path.join(frontendRoot, 'dist');

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolveRequestPath(rawUrl: string): string | null {
  const pathname = decodeURIComponent(new URL(rawUrl, `http://${host}:${port}`).pathname);
  const relativePath = pathname.replace(/^\/+/, '');
  let candidate = path.resolve(siteRoot, relativePath);

  if (candidate !== siteRoot && !candidate.startsWith(`${siteRoot}${path.sep}`)) {
    return null;
  }

  try {
    if (statSync(candidate).isDirectory()) {
      candidate = path.join(candidate, 'index.html');
    }
  } catch {
    return null;
  }

  try {
    return statSync(candidate).isFile() ? candidate : null;
  } catch {
    return null;
  }
}

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  let filePath: string | null = null;
  try {
    filePath = resolveRequestPath(request.url ?? '/');
  } catch {
    filePath = null;
  }

  if (!filePath) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
    return;
  }

  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`ZvenFit dist/ served read-only at http://${host}:${port}`);
});

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
