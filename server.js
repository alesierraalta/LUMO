
const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 8080;

console.log('[CUSTOM-SERVER] Starting Next.js application...');
console.log('[CUSTOM-SERVER] Environment:', process.env.NODE_ENV);
console.log('[CUSTOM-SERVER] Port:', port);

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log('[CUSTOM-SERVER] Next.js server ready on port', port);
  });
}).catch((ex) => {
  console.error('[CUSTOM-SERVER] Error starting server:', ex.message);
  process.exit(1);
});
