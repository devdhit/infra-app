const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { join, resolve } = require('path');
const { existsSync } = require('fs');

// Helper function to get formatted timestamp
function getTimestamp() {
    return new Date().toISOString();
}

let initializeSocketIO;
try {
  // Try to load the realtime module from dist first, then fallback to src
  const distPath = process.env.NODE_ENV === 'production' 
    ? '/opt/itams/dist' 
    : resolve(__dirname, 'dist');
  const distModulePath = join(distPath, 'lib', 'realtime');
  
  if (existsSync(distModulePath + '.js') || existsSync(distModulePath)) {
    ({ initializeSocketIO } = require(distModulePath));
  } else {
    // Fallback to src directory
    const srcModulePath = join(__dirname, 'src', 'lib', 'realtime');
    if (existsSync(srcModulePath + '.ts') || existsSync(srcModulePath)) {
      ({ initializeSocketIO } = require(srcModulePath));
    } else {
      console.warn(`[${getTimestamp()}] ⚠️  Realtime module not found at ${distModulePath} or ${srcModulePath}, Socket.IO will not be available`);
      initializeSocketIO = null;
    }
  }
} catch (error) {
  console.warn(`[${getTimestamp()}] ⚠️  Failed to load realtime module:`, error.message);
  initializeSocketIO = null;
}

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

  // Initialize Socket.IO with the HTTP server if the module was loaded successfully
  if (initializeSocketIO) {
    try {
      const io = initializeSocketIO(server);
      console.log(`[${getTimestamp()}] 🔄 Socket.IO initialized successfully`);
      
      // Add error handling for the Socket.IO server
      server.on('error', (error) => {
        console.error(`[${getTimestamp()}] ❌ Server error:`, error);
      });
      
      server.on('clientError', (error, socket) => {
        console.error(`[${getTimestamp()}] ❌ Client error:`, error);
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      });
    } catch (error) {
      console.error(`[${getTimestamp()}] ❌ Failed to initialize Socket.IO:`, error);
    }
  } else {
    console.log(`[${getTimestamp()}] ℹ️  Socket.IO not available (realtime module not loaded)`);
  }

  const port = process.env.PORT || 3001;
  
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
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log(`[${getTimestamp()}] 🛑 SIGTERM received, shutting down gracefully`);
    server.close(() => {
      console.log(`[${getTimestamp()}] 🔌 Server closed`);
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log(`[${getTimestamp()}] 🛑 SIGINT received, shutting down gracefully`);
    server.close(() => {
      console.log(`[${getTimestamp()}] 🔌 Server closed`);
      process.exit(0);
    });
  });
});