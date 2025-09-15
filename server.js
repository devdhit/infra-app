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
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';");
    
    handle(req, res, parsedUrl);
  });

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