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
	// 1. Build webview bundle
	await esbuild.build(sharedWebOptions);
	// 2. Build desktop bundle
	await esbuild.build(sharedDesktopOptions);
	
	// 3. Copy index.html and index.css
	fs.mkdirSync('dist/webview', { recursive: true });
	fs.copyFileSync('src/webview/index.html', 'dist/webview/index.html');
	fs.copyFileSync('src/webview/index.css', 'dist/webview/index.css');
	
	console.log('esbuild finished successfully.');
}

build().catch(err => {
    console.error('esbuild compilation failed:', err);
    process.exit(1);
});
