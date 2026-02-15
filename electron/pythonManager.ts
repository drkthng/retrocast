import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import http from 'http';
import { app } from 'electron';

// Use tree-kill for reliable process termination on Windows
const treeKill = require('tree-kill');

export class PythonManager {
    private process: ChildProcess | null = null;
    private readonly port = 8000;
    private readonly healthUrl = `http://127.0.0.1:${this.port}/health`;

    async start(): Promise<void> {
        const isDev = !app.isPackaged;

        if (isDev) {
            // In dev mode: start Python directly
            const backendDir = path.join(__dirname, '../../backend');
            this.process = spawn('python', ['run.py'], {
                cwd: backendDir,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env },
            });
        } else {
            // In production: run PyInstaller-built executable
            const exePath = path.join(
                process.resourcesPath,
                'backend',
                'retrocast-backend.exe'
            );
            this.process = spawn(exePath, [], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env },
            });
        }

        // Log Python output
        this.process.stdout?.on('data', (data) => {
            console.log(`[Python] ${data.toString().trim()}`);
        });
        this.process.stderr?.on('data', (data) => {
            console.error(`[Python] ${data.toString().trim()}`);
        });
        this.process.on('error', (err) => {
            console.error('[Python] Process error:', err);
        });
        this.process.on('exit', (code) => {
            console.log(`[Python] Process exited with code ${code}`);
        });

        // Wait for backend to be ready
        await this.waitForHealth(30_000); // 30 second timeout
        console.log('[Python] Backend is ready!');
    }

    async stop(): Promise<void> {
        if (this.process && this.process.pid) {
            return new Promise((resolve) => {
                treeKill(this.process!.pid, 'SIGTERM', (err: any) => {
                    if (err) {
                        console.error('[Python] Error killing process:', err);
                        // Force kill
                        treeKill(this.process!.pid, 'SIGKILL', () => resolve());
                    } else {
                        resolve();
                    }
                    this.process = null;
                });

                // Force kill after 5 seconds if still running
                setTimeout(() => {
                    if (this.process?.pid) {
                        treeKill(this.process.pid, 'SIGKILL', () => { });
                        this.process = null;
                        resolve();
                    }
                }, 5000);
            });
        }
    }

    private waitForHealth(timeout: number): Promise<void> {
        const start = Date.now();
        return new Promise((resolve, reject) => {
            const check = () => {
                if (Date.now() - start > timeout) {
                    reject(new Error(`Backend did not start within ${timeout / 1000}s`));
                    return;
                }

                http.get(this.healthUrl, (res) => {
                    if (res.statusCode === 200) {
                        resolve();
                    } else {
                        setTimeout(check, 500);
                    }
                }).on('error', () => {
                    setTimeout(check, 500);
                });
            };
            check();
        });
    }

    isRunning(): boolean {
        return this.process !== null && this.process.exitCode === null;
    }
}
