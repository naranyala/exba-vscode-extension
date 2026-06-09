const { execSync } = require("child_process");
const fs = require("node:fs");
const path = require("node:path");

async function build() {
    console.log("Starting build process with Rspack and Rsbuild...");

    // 1. Build Rust WASM
    console.log("Step 1: Building Rust WASM...");
    try {
        execSync("bun run build:rust", { stdio: "inherit" });
    } catch (e) {
        console.error("Rust build failed.");
        process.exit(1);
    }

    // 2. Build Extension with Rspack
    console.log("Step 2: Building Extension with Rspack...");
    try {
        execSync("npx rspack", { stdio: "inherit" });
    } catch (e) {
        console.error("Rspack build failed.");
        process.exit(1);
    }

    // 3. Build Webview with Rsbuild
    console.log("Step 3: Building Webview with Rsbuild...");
    try {
        execSync("bunx rsbuild build", { stdio: "inherit" });
    } catch (e) {
        console.error("Rsbuild build failed.");
        process.exit(1);
    }

    // 4. Copy WASM binary to dist/wasm/
    console.log("Step 4: Finalizing assets...");
    fs.mkdirSync("dist/wasm", { recursive: true });
    const debugWasm = "src/rust/target/wasm32-unknown-unknown/debug/dashboard_engine.wasm";
    const releaseWasm = "src/rust/target/wasm32-unknown-unknown/release/dashboard_engine.wasm";

    let wasmSource = null;
    if (fs.existsSync(releaseWasm)) {
        wasmSource = releaseWasm;
    } else if (fs.existsSync(debugWasm)) {
        wasmSource = debugWasm;
    }

    if (wasmSource) {
        console.log(`Copying WASM binary from ${wasmSource} to dist/wasm/dashboard_engine.wasm`);
        fs.copyFileSync(wasmSource, "dist/wasm/dashboard_engine.wasm");
    } else {
        console.warn("WASM binary not found. Please make sure to run cargo build first.");
    }

    console.log("Build completed successfully!");
}

build().catch((err) => {
    console.error("Build failed:", err);
    process.exit(1);
});
