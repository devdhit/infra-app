const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { join } = require('path');

// Helper function to get formatted timestamp
function getTimestamp() {
    return new Date().toISOString();
}

// Determine the correct path for the realtime module based on environment
const distPath = process.env.NODE_ENV === 'production' 
  ? '/opt/itams/dist' 
  : './dist';

const { initializeSocketIO } = require(join(distPath, 'realtime'));

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
  try {
    const io = initializeSocketIO(server);
    console.log(`[${getTimestamp()}] 🔄 Socket.IO initialized successfully`);
  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Failed to initialize Socket.IO:`, error);
  }

  const port = process.env.PORT || 3000;
  
  server.listen(port, (err) => {
    if (err) {
      console.error(`[${getTimestamp()}] ❌ Error starting server:`, err);
      process.exit(1);
    }
    console.log(`[${getTimestamp()}] 🚀 Server ready at http://localhost:${port}`);
  });
  
  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (err) => {
    console.error(`[${getTimestamp()}] ❌ Uncaught Exception:`, err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${getTimestamp()}] ❌ Unhandled Rejection at:`, promise, 'reason:', reason);
  });
});