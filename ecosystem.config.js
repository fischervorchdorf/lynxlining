module.exports = {
  apps: [{
    name: 'lynx-lining',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/lynx-lining/error.log',
    out_file: '/var/log/lynx-lining/access.log',
    merge_logs: true,
    time: true
  }]
};
