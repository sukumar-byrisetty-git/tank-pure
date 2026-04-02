module.exports = {
    apps: [
        {
            name: 'water-tank-api',
            script: './server.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 4000,
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 4000,
            },
            env_staging: {
                NODE_ENV: 'staging',
                PORT: 4000,
            },
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            autorestart: true,
            watch: process.env.NODE_ENV === 'development',
            ignore_watch: ['node_modules', 'logs', 'coverage'],
            max_memory_restart: '1G',
            kill_timeout: 5000,
            listen_timeout: 3000,
            wait_ready: true,
            max_restarts: 10,
            min_uptime: '10s',
        },
    ],
    deploy: {
        production: {
            user: 'node',
            host: process.env.DEPLOY_HOST || 'your-server.com',
            ref: 'origin/main',
            repo: 'git@github.com:your-username/water-tank-api.git',
            path: '/var/www/water-tank-api',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
        },
    },
};
