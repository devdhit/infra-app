const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { join, resolve } = require('path');
const { existsSync } = require('fs');

// Import our new logger with fallback mechanism
let logger;
try {
  // Try to load the logger module from dist first, then fallback to src
  const distPath = process.env.NODE_ENV === 'production' 
    ? process.env.ITAMS_DIST_PATH || '/opt/itams/dist' 
    : resolve(__dirname, 'dist');
  const distLoggerPath = join(distPath, 'lib', 'logger');
  
  if (existsSync(distLoggerPath + '.js') || existsSync(distLoggerPath)) {
    logger = require(distLoggerPath);
    console.log(`[INFO] [${new Date().toISOString()}] Loaded logger module from dist: ${distLoggerPath}`);
  } else {
    // Fallback to src directory
    const srcLoggerPath = join(__dirname, 'src', 'lib', 'logger');
    if (existsSync(srcLoggerPath + '.ts') || existsSync(srcLoggerPath)) {
      logger = require(srcLoggerPath);
      console.log(`[INFO] [${new Date().toISOString()}] Loaded logger module from src: ${srcLoggerPath}`);
    } else {
      // Fallback to basic console logging if logger module is not found
      console.warn(`[WARN] [${new Date().toISOString()}] Logger module not found at ${distLoggerPath} or ${srcLoggerPath}, using basic console logging`);
      logger = {
        debug: (...args) => process.env.NODE_ENV === 'development' && console.log('[DEBUG]', ...args),
        info: (...args) => process.env.NODE_ENV === 'development' && console.log('[INFO]', ...args),
        warn: (...args) => console.warn('[WARN]', ...args),
        error: (...args) => console.error('[ERROR]', ...args),
        emojiLog: (emoji, ...args) => process.env.NODE_ENV === 'development' && console.log(emoji, ...args)
      };
    }
  }
} catch (error) {
  console.error(`[ERROR] [${new Date().toISOString()}] Failed to load logger module: ${error.message}`);
  // Fallback to basic console logging if there's an error
  logger = {
    debug: (...args) => process.env.NODE_ENV === 'development' && console.log('[DEBUG]', ...args),
    info: (...args) => process.env.NODE_ENV === 'development' && console.log('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    emojiLog: (emoji, ...args) => process.env.NODE_ENV === 'development' && console.log(emoji, ...args)
  };
}

// Helper function to get formatted timestamp (keeping for backward compatibility)
function getTimestamp() {
    return new Date().toISOString();
}

let initializeSocketIO;
try {
  // Try to load the realtime module from dist first, then fallback to src
  const distPath = process.env.NODE_ENV === 'production' 
    ? process.env.ITAMS_DIST_PATH || '/opt/itams/dist' 
    : resolve(__dirname, 'dist');
  const distModulePath = join(distPath, 'lib', 'realtime');
  
  if (existsSync(distModulePath + '.js') || existsSync(distModulePath)) {
    ({ initializeSocketIO } = require(distModulePath));
    logger.emojiLog('📦', `Loaded realtime module from dist: ${distModulePath}`);
  } else {
    // Fallback to src directory
    const srcModulePath = join(__dirname, 'src', 'lib', 'realtime');
    if (existsSync(srcModulePath + '.ts') || existsSync(srcModulePath)) {
      ({ initializeSocketIO } = require(srcModulePath));
      logger.emojiLog('📦', `Loaded realtime module from src: ${srcModulePath}`);
    } else {
      logger.warn(`Realtime module not found at ${distModulePath} or ${srcModulePath}, Socket.IO will not be available`);
      initializeSocketIO = null;
    }
  }
} catch (error) {
  logger.warn(`Failed to load realtime module: ${error.message}`);
  initializeSocketIO = null;
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Track if shutdown handlers have been registered
let shutdownHandlersRegistered = false;

// Function to register shutdown handlers only once
function registerShutdownHandlers(server) {
  if (shutdownHandlersRegistered) {
    return;
  }
  
  shutdownHandlersRegistered = true;
  
  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err}`);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  });
  
  // Graceful shutdown
  const shutdownHandler = () => {
    logger.info('Shutdown signal received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };
  
  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);
}

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
      logger.emojiLog('🔄', 'Socket.IO initialized successfully');
      
      // Add error handling for the Socket.IO server
      server.on('error', (error) => {
        // Handle EPIPE errors specifically
        if (error.code === 'EPIPE') {
          logger.warn('EPIPE error caught - client likely disconnected abruptly');
        } else {
          logger.error(`Server error: ${error}`);
        }
      });
      
      server.on('clientError', (error, socket) => {
        // Handle EPIPE errors specifically
        if (error.code === 'EPIPE') {
          logger.warn('EPIPE error on client connection - client likely disconnected abruptly');
        } else {
          logger.error(`Client error: ${error}`);
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
      });
    } catch (error) {
      logger.error(`Failed to initialize Socket.IO: ${error}`);
    }
  } else {
    logger.info('Socket.IO not available (realtime module not loaded)');
  }

  const port = process.env.PORT || 3001;
  
  server.listen(port, (err) => {
    if (err) {
      logger.error(`Error starting server: ${err}`);
      process.exit(1);
    }
    logger.emojiLog('🚀', `Server ready at http://localhost:${port}`);
  });
  
  // Register shutdown handlers
  registerShutdownHandlers(server);
});