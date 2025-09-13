module.exports = {
  apps: [{
    name: 'itams',
    script: 'server.js',
    cwd: process.env.ITAMS_PATH || 'C:\\infra-app',
    instances: 1,
    exec_mode: 'fork',
    // Pre-start script to build the server components
    prestart: 'npm run build:server',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000,
      ITAMS_DIST_PATH: process.env.ITAMS_PATH ? `${process.env.ITAMS_PATH}/dist` : 'C:\\infra-app\\dist',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    // Add error handling and restart configuration
    max_restarts: 10,
    min_uptime: "5m",
    restart_delay: 5000,
    // Add error file logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // Kill process if it exits unexpectedly
    kill_timeout: 3000,
    // Watch and restart on file changes (useful for development)
    watch: false
  }]
}