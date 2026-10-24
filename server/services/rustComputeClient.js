// server/services/rustComputeClient.js
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const log = require('../utils/logger');

const RUST_BIN = path.resolve(__dirname, '..', '..', 'bin', 'imentor-compute-kernel');
const RUST_DAEMON_PORT = parseInt(process.env.RUST_KERNEL_PORT || '3009', 10);
const RUST_DAEMON_HOST = process.env.RUST_KERNEL_HOST || '127.0.0.1';
const keepAliveAgent = new http.Agent({ keepAlive: true, maxSockets: 32 });

function isRustKernelAvailable() {
    return fs.existsSync(RUST_BIN);
}

function callRustHttpDaemon(routePath, bodyText, timeoutMs = 4000) {
    return new Promise((resolve) => {
        const bodyBuf = Buffer.from(bodyText, 'utf8');
        const req = http.request({
            hostname: RUST_DAEMON_HOST,
            port: RUST_DAEMON_PORT,
            path: routePath,
            method: 'POST',
            agent: keepAliveAgent,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Length': bodyBuf.length
            },
            timeout: timeoutMs
        }, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                if (res.statusCode !== 200) return resolve(null);
                try {
                    const text = Buffer.concat(chunks).toString('utf8');
                    resolve(JSON.parse(text));
                } catch (_) {
                    resolve(null);
                }
            });
        });
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.on('error', () => resolve(null));
        req.write(bodyBuf);
        req.end();
    });
}

function spawnRustFallback(args, payload, timeoutMs = 8000) {
    return new Promise((resolve) => {
        if (!isRustKernelAvailable()) return resolve(null);
        const proc = spawn(RUST_BIN, args, { stdio: ['pipe', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';
        const timer = setTimeout(() => {
            try { proc.kill('SIGKILL'); } catch (_) {}
            resolve(null);
        }, timeoutMs);
        proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
        proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
        proc.on('error', (err) => {
            clearTimeout(timer);
            log.warn('RUST_KERNEL', `Spawn error: ${err.message}`);
            resolve(null);
        });
        proc.on('close', (code) => {
            clearTimeout(timer);
            if (code !== 0 || !stdout) {
                if (stderr) log.warn('RUST_KERNEL', `Non-zero exit (${code}): ${stderr}`);
                return resolve(null);
            }
            try {
                resolve(JSON.parse(stdout));
            } catch (e) {
                log.warn('RUST_KERNEL', `JSON parse failed: ${e.message}`);
                resolve(null);
            }
        });
        proc.stdin.write(payload);
        proc.stdin.end();
    });
}

async function parseAndRankAcademicBatch(query = '', rawTexts = []) {
    if (!Array.isArray(rawTexts) || rawTexts.length === 0) {
        return null;
    }
    const payload = String(query || '').replace(/\n/g, ' ') + '\n' + rawTexts.join('\n===PAPER===\n');
    const daemonRes = await callRustHttpDaemon('/batch', payload, 4000);
    if (daemonRes && daemonRes.ok) {
        return daemonRes;
    }
    return spawnRustFallback(['--json'], payload, 8000);
}

async function analyzeAcademicIntegrity(studentText = '', referenceText = '') {
    if (!studentText) return null;
    const payload = String(studentText || '') + '\n===COMPARE===\n' + String(referenceText || '');
    const daemonRes = await callRustHttpDaemon('/integrity', payload, 3000);
    if (daemonRes && daemonRes.ok) {
        return daemonRes;
    }
    return spawnRustFallback(['--integrity'], payload, 5000);
}

module.exports = {
    isRustKernelAvailable,
    parseAndRankAcademicBatch,
    analyzeAcademicIntegrity
};
