import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

function runSubfinder(domain, options = {}) {
	return new Promise((resolve, reject) => {
		if (!domain || typeof domain !== 'string') {
			return reject(new TypeError('domain must be a non-empty string'));
		}

		const args = ['-d', domain, '--silent'];
		if (Array.isArray(options.args) && options.args.length) args.push(...options.args);

		let subfinderPath = process.env.SUBFINDER || 'subfinder';
		if (!fs.existsSync(subfinderPath)) {
			const goBin = path.join(process.env.GOPATH || path.join(process.env.HOME || '', 'go'), 'bin', 'subfinder');
			if (fs.existsSync(goBin)) subfinderPath = goBin;
		}

		let timedOut = false;
		const proc = spawn(subfinderPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

		const found = new Set();
		let stderr = '';

		proc.stdout.setEncoding('utf8');
		proc.stdout.on('data', (chunk) => {
			// chunk can contain multiple lines
			chunk.toString().split(/\r?\n/).forEach((line) => {
				const s = line.trim();
				if (s) found.add(s);
			});
		});

		proc.stderr.setEncoding('utf8');
		proc.stderr.on('data', (chunk) => {
			stderr += chunk.toString();
		});

		proc.on('error', (err) => {
			reject(err);
		});

		proc.on('close', (code, signal) => {
			if (timedOut) return; // already rejected by timeout

			if (code === 0 || found.size > 0) {
				resolve(Array.from(found));
			} else {
				const err = new Error(
					`subfinder exited with code ${code}${stderr ? ': ' + stderr.trim() : ''}`
				);
				err.code = code;
				err.stderr = stderr;
				reject(err);
			}
		});

		if (options.timeout && Number.isFinite(options.timeout) && options.timeout > 0) {
			setTimeout(() => {
				timedOut = true;
				try {
					proc.kill('SIGTERM');
				} catch (e) {
					// ignore kill errors
				}
				const err = new Error('subfinder timed out');
				err.code = 'ETIMEDOUT';
				reject(err);
			}, options.timeout);
		}
	});
}

export default runSubfinder;