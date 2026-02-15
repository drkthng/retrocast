const concurrently = require('concurrently');
const path = require('path');

// Start all three processes for development
const { result } = concurrently([
    {
        command: 'cd backend && python run.py',
        name: 'backend',
        prefixColor: 'green',
    },
    {
        command: 'cd frontend && npm run dev',
        name: 'frontend',
        prefixColor: 'blue',
    },
    {
        command: 'echo "Waiting for health checks..." && npx wait-on --timeout 60000 http://127.0.0.1:8000/health http://127.0.0.1:5173 && echo "Health checks passed! Compiling Electron..." && npx tsc -p tsconfig.electron.json && echo "Starting Electron..." && npx electron .',
        name: 'electron',
        prefixColor: 'yellow',
    },
], {
    killOthersOn: ['failure', 'success'],
    restartTries: 0,
});

result.catch((err) => {
    console.error('Dev startup failed:', err);
    process.exit(1);
});
