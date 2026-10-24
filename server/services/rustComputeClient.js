// server/services/rustComputeClient.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const log = require('../utils/logger');

const RUST_BIN = path.resolve(__dirname, '..', '..', 'bin', 'imentor-compute-kernel');

function isRustKernelAvailable() {
    return fs.existsSync(RUST_BIN);
}

/**
 * Runs the multi-threaded Rust compute kernel (imentor-compute-kernel --json)
 * to parse full-text academic sections, quantitative metrics, technical entities,
 * and Okapi BM25 relevance scores without blocking the Node.js event loop.
 */
function parseAndRankAcademicBatch(query = '', rawTexts = []) {
    return new Promise((resolve) => {
        if (!isRustKernelAvailable() || !Array.isArray(rawTexts) || rawTexts.length === 0) {
            return resolve(null);
        }

        const payload = String(query || '').replace(/\n/g, ' ') + '\n' + rawTexts.join('\n===PAPER===\n');
        const proc = spawn(RUST_BIN, ['--json'], { stdio: ['pipe', 'pipe', 'pipe'] });

        let stdout = '';
        let stderr = '';
        const timer = setTimeout(() => {
            try { proc.kill('SIGKILL'); } catch (_) {}
            resolve(null);
        }, 8000);

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

/**
 * Runs 3-gram Jaccard shingle overlap & sentence burstiness analysis in native Rust.
 */
function analyzeAcademicIntegrity(textA = '', textB = '') {
    return new Promise((resolve) => {
        if (!isRustKernelAvailable()) return resolve(null);
        const payload = `${textA}\n===COMPARE===\n${textB}`;
        const proc = spawn(RUST_BIN, ['--integrity'], { stdio: ['pipe', 'pipe', 'pipe'] });
        let stdout = '';
        const timer = setTimeout(() => {
            try { proc.kill('SIGKILL'); } catch (_) {}
            resolve(null);
        }, 5000);
        proc.stdout.on('data', (c) => { stdout += c.toString(); });
        proc.on('error', () => { clearTimeout(timer); resolve(null); });
        proc.on('close', (code) => {
            clearTimeout(timer);
            if (code !== 0 || !stdout) return resolve(null);
            try { resolve(JSON.parse(stdout)); } catch { resolve(null); }
        });
        proc.stdin.write(payload);
        proc.stdin.end();
    });
}

module.exports = {
    isRustKernelAvailable,
    parseAndRankAcademicBatch,
    analyzeAcademicIntegrity
};
