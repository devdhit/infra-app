module.exports = {
  apps: [{
    name: 'itams',
    script: '/opt/itams/node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/opt/itams',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}