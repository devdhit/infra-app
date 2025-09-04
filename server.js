const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeSocketIO } = require('./dist/realtime');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl = parse(req.url, true);
    
    // Let Socket.IO handle its own requests
    // The Socket.IO server will automatically handle requests with /socket.io/ path
    
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO with the HTTP server
  const io = initializeSocketIO(server);

  const port = process.env.PORT || 3000;
  
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});