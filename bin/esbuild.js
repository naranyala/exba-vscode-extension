const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const sharedWebOptions = {
	bundle: true,
	entryPoints: ['src/webview/app-component.ts'],
	outfile: 'dist/webview/bundle.js',
	format: 'esm',
	target: 'es2022',
	platform: 'browser',
	sourcemap: true,
};

const sharedDesktopOptions = {
	bundle: true,
	external: ['vscode'],
	entryPoints: ['src/extension.ts'],
	outfile: 'dist/extension.js',
	format: 'cjs',
	target: 'node16',
	platform: 'node',
	sourcemap: true,
};

async function build() {
	// 1. Build TypeScript bundles
	await esbuild.build(sharedWebOptions);
	await esbuild.build(sharedDesktopOptions);
	
	// 2. Copy HTML markup and styling files
	fs.mkdirSync('dist/webview', { recursive: true });
	fs.copyFileSync('src/webview/index.html', 'dist/webview/index.html');
	fs.copyFileSync('src/webview/index.css', 'dist/webview/index.css');

	// 3. Resolve and copy compiled WASM core to dist/wasm/
	fs.mkdirSync('dist/wasm', { recursive: true });
	const debugWasm = 'src/rust/target/wasm32-unknown-unknown/debug/dashboard_engine.wasm';
	const releaseWasm = 'src/rust/target/wasm32-unknown-unknown/release/dashboard_engine.wasm';
	
	let wasmSource = null;
	if (fs.existsSync(releaseWasm)) {
		wasmSource = releaseWasm;
	} else if (fs.existsSync(debugWasm)) {
		wasmSource = debugWasm;
	}
	
	if (wasmSource) {
		console.log(`Copying WASM binary from ${wasmSource} to dist/wasm/dashboard_engine.wasm`);
		fs.copyFileSync(wasmSource, 'dist/wasm/dashboard_engine.wasm');
	} else {
		console.warn('WASM binary not found. Please make sure to run cargo build first.');
	}
	
	console.log('esbuild finished successfully.');
}

build().catch(err => {
    console.error('esbuild compilation failed:', err);
    process.exit(1);
});
