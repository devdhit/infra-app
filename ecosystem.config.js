module.exports = {
  apps: [{
    name: 'itams',
    script: 'server.js',
    cwd: '/opt/itams',
    instances: 1, // Change to 1 to avoid port conflicts with Socket.IO
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Add error handling and restart configuration
    max_restarts: 10,
    min_uptime: "5m",
    restart_delay: 5000
  }]
}