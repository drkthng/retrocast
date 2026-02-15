const { execSync } = require('child_process');
const path = require('path');

console.log('Building Python backend with PyInstaller...');

const backendDir = path.join(__dirname, '..', 'backend');

execSync(
    'pyinstaller --onedir --name retrocast-backend --add-data "app;app" run.py',
    {
        cwd: backendDir,
        stdio: 'inherit',
        env: { ...process.env },
    }
);

console.log('Python backend built successfully!');
