# VS Code Extension with Rust-WASM (Component Model)

This starter template demonstrates how to build a VS Code extension that executes Rust code compiled to WebAssembly (WASM) using the **WebAssembly Component Model** and the Bun runtime.

The template implements a simple calculator service in Rust ([lib.rs](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-component-model/src/lib.rs)) that performs arithmetic operations. The extension host ([extension.ts](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-component-model/src/extension.ts)) instantiates the WASM module and invokes its methods via TypeScript type bindings.

---

## 🛠️ Pre-requisites

Make sure you have the following toolchains installed on your system:

- **Bun**: The JavaScript runtime and package manager used for this extension. (Get it at [bun.sh](https://bun.sh)).
- **Rust & Cargo**: Rust compiler and manager. (Get it at [rustup.rs](https://rustup.rs)).
- **WASM Target**: Add the WebAssembly target to your Rust toolchain:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- **wasm-tools**: The CLI utility for WebAssembly Component Model manipulation (at least version `>= 1.200`). Download precompiled binaries from [Bytecode Alliance releases](https://github.com/bytecodealliance/wasm-tools/releases) and add it to your `PATH`.

---

## 💻 Local Development & Testing

### 1. Installation
Install all Node dependencies using Bun:
```bash
bun install
```

### 2. Generate TypeScript bindings from WIT
If you make changes to the WebAssembly Interface Type (WIT) definition in [calculator.wit](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-component-model/wit/calculator.wit), regenerate the corresponding TypeScript model types:
```bash
bun run generate:model
```

### 3. Compile the Codebase
Build the TypeScript extension code and compile the Rust source into WebAssembly:
```bash
bun run build
```
This script compiles the Rust target to `target/wasm32-unknown-unknown/debug/calculator.wasm`.

### 4. Running the Extension

#### Desktop Environment
1. Open this directory in VS Code.
2. Open the **Run and Debug** view (`Ctrl+Shift+D` / `Cmd+Shift+D`).
3. Select **Run Example** and press **F5** to start a new Extension Development Host window.
4. In the new window, open the Command Palette (`Ctrl+Shift+P`) and execute **Run Calc Service**.
5. Check the **Calculator** and **Calculator - Log** outputs in the Output pane to see the results.

#### Web/Browser Environment (vscode.dev)
1. Build the extension bundle for the browser:
   ```bash
   bun run esbuild
   ```
2. Start a local secure server:
   ```bash
   bun run serve
   ```
3. Open [vscode.dev](https://vscode.dev) in your browser.
4. Run the command **Developer: Install Extension from Location...** and enter `https://localhost:5000`.

---

## 📦 Publishing Process

To package and publish your extension to the VS Code Marketplace, follow these steps:

### 1. Optimize Paths for Production
During local development, [extension.ts](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-component-model/src/extension.ts) is configured to read the compiled WASM binary from the cargo debug folder:
```typescript
const filename = vscode.Uri.joinPath(context.extensionUri, 'target', 'wasm32-unknown-unknown', 'debug', 'calculator.wasm');
```

For production/publishing:
1. Compile the Rust module in release mode (for smaller size and optimal speed):
   ```bash
   cargo build --target wasm32-unknown-unknown --release
   ```
2. Copy the compiled WASM binary (`calculator.wasm`) to a production folder like `dist/` or `out/`:
   ```bash
   mkdir -p dist/wasm && cp target/wasm32-unknown-unknown/release/calculator.wasm dist/wasm/
   ```
3. Update [extension.ts](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-component-model/src/extension.ts) to resolve the production path:
   ```typescript
   const filename = vscode.Uri.joinPath(context.extensionUri, 'dist', 'wasm', 'calculator.wasm');
   ```

### 2. Configure `.vscodeignore`
Create a `.vscodeignore` file in the project root to ensure that you do **not** pack heavy build caches, source codes, and local configuration folders:
```text
.vscode/**
src/**
wit/**
target/**
Cargo.*
tsconfig.json
node_modules/**
```

### 3. Package and Publish using VSCE
Use the official VS Code Extension Manager (`@vscode/vsce`) tool:

1. **Install VSCE globally**:
   ```bash
   bun install --global @vscode/vsce
   ```
2. **Package the extension** into a `.vsix` file:
   ```bash
   vsce package
   ```
3. **Verify the bundle**: Install the generated `.vsix` file manually into your VS Code (via *Extensions > Install from VSIX...*) to verify it functions correctly.
4. **Publish to the Marketplace**:
   ```bash
   vsce publish -p <YOUR_MARKETPLACE_PERSONAL_ACCESS_TOKEN>
   ```