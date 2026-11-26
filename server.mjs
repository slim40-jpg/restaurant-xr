/**
 * @file    server.mjs
 * @brief   Serveur statique minimal, pour remplacer `python -m http.server`.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-25
 * @role    Sert les fichiers avec les bons MIME types (`.mjs` en `text/javascript`).
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const safe = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, safe === '/' ? 'index.html' : safe);

  // If the path is a directory, append index.html
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, 'index.html');
  } catch {
    // not found, fall through to 404
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    });
    res.end(body);
  } catch (err) {
    console.error('[serve] 404', file, err.code);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 ' + file);
  }
}).listen(8000, () => console.log('Serving', ROOT, 'on http://localhost:8000'));