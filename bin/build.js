const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function getWasmBinary() {
    const releaseWasm = "rust/target/wasm32-unknown-unknown/release/dashboard_engine.wasm";
    const debugWasm = "rust/target/wasm32-unknown-unknown/debug/dashboard_engine.wasm";

    if (fs.existsSync(releaseWasm)) {
        return { path: releaseWasm, profile: "release" };
    }
    if (fs.existsSync(debugWasm)) {
        return { path: debugWasm, profile: "debug" };
    }
    return null;
}

function tryWasmOpt(inputPath, outputPath) {
    try {
        execSync(`wasm-opt -Oz -o "${outputPath}" "${inputPath}"`, {
            stdio: "pipe",
        });
        console.log("  wasm-opt: optimized");
        return true;
    } catch {
        console.log("  wasm-opt: not available, skipping");
        return false;
    }
}

async function build() {
    console.log("Starting build process with Rspack and Rsbuild...");

    // 1. Build Extension with Rspack
    console.log("Step 1: Building Extension with Rspack...");
    try {
        execSync("npx rspack", { stdio: "inherit" });
    } catch (e) {
        console.error("Rspack build failed.");
        process.exit(1);
    }

    // 2. Build Webview with Rsbuild
    console.log("Step 2: Building Webview with Rsbuild...");
    try {
        execSync("bunx rsbuild build", { stdio: "inherit" });
    } catch (e) {
        console.error("Rsbuild build failed.");
        process.exit(1);
    }

    // 3. Copy WASM binary to dist/wasm/ (Rust must be pre-built by package.json script)
    console.log("Step 3: Finalizing assets...");
    fs.mkdirSync("dist/wasm", { recursive: true });

    const wasmSource = getWasmBinary();
    const destPath = "dist/wasm/dashboard_engine.wasm";

    if (wasmSource) {
        console.log(`Copying WASM binary from ${wasmSource.path} (${wasmSource.profile})`);
        fs.copyFileSync(wasmSource.path, destPath);

        const size = fs.statSync(destPath).size;
        console.log(`  size: ${(size / 1024).toFixed(1)} KB`);

        if (wasmSource.profile === "release") {
            tryWasmOpt(destPath, destPath);
            const optSize = fs.statSync(destPath).size;
            console.log(`  after opt: ${(optSize / 1024).toFixed(1)} KB`);
        }
    } else {
        console.warn("WASM binary not found. Run 'bun run build:rust' first.");
    }

    // Copy media folder for icons and assets
    console.log("Copying media assets...");
    fs.mkdirSync("dist/media", { recursive: true });
    const mediaFiles = fs.readdirSync("media");
    for (const file of mediaFiles) {
        fs.copyFileSync(path.join("media", file), path.join("dist/media", file));
    }

    console.log("Copying sql.js WASM binary...");
    const sqlWasmPath = "node_modules/sql.js/dist/sql-wasm.wasm";
    if (fs.existsSync(sqlWasmPath)) {
        fs.copyFileSync(sqlWasmPath, "dist/media/sql-wasm.wasm");
    }

    console.log("Build completed successfully!");
}

build().catch((err) => {
    console.error("Build failed:", err);
    process.exit(1);
});
