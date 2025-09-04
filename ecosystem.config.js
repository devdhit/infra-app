module.exports = {
  apps: [{
    name: 'itams',
    script: 'server.js',
    cwd: '/opt/itams', // This will be the deployment path on Ubuntu
    instances: 1,
    exec_mode: 'fork',
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