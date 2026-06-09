# Unified VS Code Extension Starter & Showcase

This repository is a curated, high-quality starting point for building Visual Studio Code extensions. It consolidates multiple VS Code API features into a **single extension project** configured for the **Bun** runtime.

---

## 🌟 Showcased Features

This starter contains 4 distinct API demonstrations activated within a single extension instance:

1.  **Hello World** (`samples.helloWorld`): Demonstrates basic commands, menu contributions, and system notification messages.
2.  **Tree View** (`nodeDependencies`): A custom Explorer/Sidebar view that reads the current workspace's `package.json` file and displays dependencies inside a native TreeView.
3.  **Webview (Cat)** (`samples.showWebview`): Demonstrates opening a standard HTML/CSS webview panel and serving a local media asset (`cat.gif`).
4.  **WASM Web Component Dashboard** (`samples.showDashboard`): Renders a browser-native Custom Element dashboard backed by a high-performance, zero-dependency Rust-WASM engine ([src/rust/](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/src/rust)). Key features of this implementation include:
    - **Explorer Grid with Fuzzy Search**: (Default view) Lists tool cards with category badges and tag chips, filtered instantly as you type via reactive fuzzy search.
    - **Proxy-Based Reactive State**: A custom state container ([wasm-framework.ts](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/src/webview/wasm-framework.ts)) implementing reactivity via ES6 Proxies and batching updates inside `requestAnimationFrame`.
    - **Global Shared Store (`WasmStore`)**: Synchronizes settings and calculation inputs between separate Custom Elements (`<dashboard-app>` and `<settings-panel>`).
    - **Dynamic Rust Calculator**: Rust backend calculations recalculate metrics in real-time based on the shared Web Component state.

---

## 📂 Project Structure

- [package.json](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/package.json): Defines extension activation events, commands, views, scripts, and dependencies (including `@vscode/webview-ui-toolkit` and language servers).
- [tsconfig.json](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/tsconfig.json): TypeScript configuration supporting both Node (extension host) and DOM (webview frontend) code.
- [esbuild.js](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/bin/esbuild.js): Bundles the extension host and webview files, copies UI resources, and copies compiled WASM binaries to `dist/`.
- `src/extension.ts`: Main entry point activating the features.
- `src/*.ts`: Feature controllers (Hello World, Tree View, Webview, and WASM Dashboard).
- `src/webview/`: Browser-native Custom Element components and Proxy-based reactive state framework.
- `src/rust/`: Rust library compiling to WebAssembly.
- `media/`: Static assets (icons and images).

---

## 🚀 How to Run and Test Locally

### 1. Prerequisites
Ensure you have the following toolchains installed:
- **Bun**: Javascript runtime and package manager (`bun --version`).
- **Rust & Cargo**: Required for WASM compilation.
- **wasm32-unknown-unknown target**:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```

### 2. Setup
Install project dependencies:
```bash
bun install
```

### 3. Build
Compile the Rust target and bundle the TypeScript assets with a single command:
```bash
bun run build
```
This script compiles Rust to WebAssembly and copies the binary to `dist/wasm/dashboard_engine.wasm`.

### 4. Running the Extension
1.  Open the workspace folder in VS Code.
2.  Press **F5** (or select **Launch Extension** in the Debug tab).
3.  A new **Extension Development Host** VS Code window will open.
4.  Run commands from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):
    - `Samples: Hello World`
    - `Samples: Webview Demo (Cat)`
    - `Samples: WASM Web Component Dashboard`
5.  Check the **Package Explorer** icon in the Sidebar to view your workspace dependencies.

---

## 📦 Packaging & Publishing

To package your extension into a `.vsix` file for distribution or marketplace upload:

1.  **Install VSCE globally**:
    ```bash
    bun install --global @vscode/vsce
    ```
2.  **Compile Rust in Release Mode**:
    ```bash
    cargo build --target wasm32-unknown-unknown --release --manifest-path src/rust/Cargo.toml
    ```
3.  **Run Javascript Bundler**:
    ```bash
    bun run build:js
    ```
    *(The build script will detect the release WASM file and copy it to `dist/wasm/` automatically)*.
4.  **Package**:
    ```bash
    vsce package
    ```
    This generates a `.vsix` package. You can manually install this VSIX file in VS Code or publish it to the Marketplace using `vsce publish`.
