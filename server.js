/**
 * server.js — Honeyroll
 * Sirve archivos estáticos en el puerto 3000.
 * Escucha en IPv4 (0.0.0.0) e IPv6 (::) simultáneamente.
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PORT = 3000;

// Tipos MIME soportados
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

// ── Recopilar todas las IPs locales (IPv4 e IPv6) ──
function getLocalAddresses() {
  const ipv4 = [], ipv6 = [];
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.internal) continue;
      if (iface.family === 'IPv4') {
        ipv4.push(iface.address);
      } else if (iface.family === 'IPv6') {
        ipv6.push(iface.address);
      }
    }
  }
  return { ipv4, ipv6 };
}

// ── Handler de peticiones ──
const handler = (req, res) => {
  let urlPath = req.url.split('?')[0].split('#')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(__dirname, urlPath);
  const safeRoot = path.resolve(__dirname);
  const safePath = path.resolve(filePath);

  // Evitar path traversal
  if (!safePath.startsWith(safeRoot)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h1>404 🐾</h1><p>No encontrado: <code>${urlPath}</code></p>
          <a href="/">← Inicio</a></body></html>`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error: ' + err.message);
      }
      return;
    }

    const ext         = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
};

// ── Crear el servidor ──
// ipv6: true  → Node escucha en :: (dual-stack en Windows/Linux/Mac)
// Lo que significa que una sola instancia responde a IPv4 e IPv6.
const server = http.createServer(handler);

server.listen({ port: PORT, host: '::', ipv6Only: false }, () => {
  const { ipv4, ipv6 } = getLocalAddresses();

  console.log('\n✨ ══════════════════════════════════════════════ ✨');
  console.log('   🐾  Honeyroll disponible en:');
  console.log(`\n       http://localhost:${PORT}            (local)`);

  ipv4.forEach(ip => {
    console.log(`       http://${ip}:${PORT}`.padEnd(48) + '← IPv4 red local');
  });

  ipv6.forEach(ip => {
    // Las IPs link-local (fe80::) requieren el índice de interfaz; las globales no
    const bracketed = `[${ip}]`;
    console.log(`       http://${bracketed}:${PORT}`.padEnd(48) + '← IPv6 red local');
  });

  console.log('\n✨ ══════════════════════════════════════════════ ✨\n');
});

// Si dual-stack no está disponible (algunos sistemas con ipv6only forzado),
// levantar un segundo servidor IPv4 de respaldo.
server.on('error', (err) => {
  if (err.code === 'EAFNOSUPPORT' || err.code === 'EADDRNOTAVAIL') {
    console.warn('⚠️  IPv6 no disponible, usando solo IPv4…');
    const fallback = http.createServer(handler);
    fallback.listen(PORT, '0.0.0.0', () => {
      const { ipv4 } = getLocalAddresses();
      console.log('\n✨ ══════════════════════════════════════════════ ✨');
      console.log('   🐾  Honeyroll disponible en:');
      console.log(`\n       http://localhost:${PORT}`);
      ipv4.forEach(ip => console.log(`       http://${ip}:${PORT}  ← IPv4`));
      console.log('\n✨ ══════════════════════════════════════════════ ✨\n');
    });
  } else {
    console.error('❌ Error al iniciar servidor:', err.message);
    process.exit(1);
  }
});
