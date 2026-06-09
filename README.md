# Slim VS Code Extension Starter Kit

This repository is a curated, streamlined starter kit for building Visual Studio Code extensions. It features standard TypeScript extensions, Sidebar/TreeView views, Webview overlays, Language Server Protocol (LSP) diagnostics, and high-performance Rust WebAssembly (WASM) components, optimized to run using the **Bun** runtime.

---

## 📦 Included Samples

| Category | Sample | Description & APIs |
| -------- | ------ | ------------------ |
| **Basic** | [Hello World](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/helloworld-sample) | The baseline starter project explaining VS Code extension anatomy. |
| **UI** | [Tree View](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/tree-view-sample) | Shows how to contribute custom sidebar and explorer tree views. |
| **Rich UI** | [Webview Sample](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/webview-sample) | Embed custom web UIs using HTML/CSS inside VS Code webview panels. |
| **Language** | [LSP Sample](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/lsp-sample) | Illustrates how to integrate a Language Server Protocol (LSP) analyzer. |
| **WebAssembly** | [WASM Component Model](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-component-model) | Integrates Rust compiled to WASM using the Component Model. |
| **Custom Web** | [WASM Web Component Framework](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-webcomponent-webview-sample) | A custom, reactive browser Web Component framework utilizing Rust WASM core. |

---

## 🚀 How to Test Locally

### 1. Prerequisites
Ensure you have the following toolchains installed globally:
*   **Bun**: JavaScript runtime and package manager (`bun --version`).
*   **Rust & Cargo**: Required for WASM compilation.
*   **wasm-tools**: Command-line tool for WASM component model translation (version `>= 1.200`). Download from [Bytecode Alliance releases](https://github.com/bytecodealliance/wasm-tools/releases).
*   **rustup target**: Add target support for WebAssembly:
    ```bash
    rustup target add wasm32-unknown-unknown
    ```

### 2. Dependency Installation
Install dependencies across the monorepo:
```bash
# Install root script tooling
bun install

# Install dependencies inside all sample project folders
bun run install-all
```

### 3. Compilation
Compile all TypeScript code and Rust WASM modules in the codebase:
```bash
bun run compile-all
```

### 4. Running an Extension
1.  Open any individual sample directory (e.g., `webview-sample/` or `wasm-webcomponent-webview-sample/`) in a new VS Code window.
2.  Press **F5** (or open the **Run and Debug** side panel and click **Launch Extension / Run Example**).
3.  A new **Extension Development Host** VS Code window will open with the extension loaded.
4.  Execute commands from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) to run the features.

---

## 📦 Publishing Process

To pack and publish any of these extensions to the Visual Studio Marketplace, follow these steps:

### 1. Install VSCE (VS Code Extension Manager)
Install the publishing CLI tool globally:
```bash
bun install --global @vscode/vsce
```

### 2. Prepare the Extension for Production
Before packaging, you must compile your TypeScript code and WASM binaries in production mode:
- **Build Release WASM**: Compile the Rust engine in release mode for maximum speed and minimal file size:
  ```bash
  cargo build --target wasm32-unknown-unknown --release
  ```
- **Copy Release Binaries**: Copy the output `.wasm` file into a static directory (e.g., `dist/` or `out/`) and make sure the extension loader loads from that production folder instead of the `target/` debug path.
- **Run Production Bundle**: Bundle your JavaScript/TypeScript files with a bundler (like `esbuild` or `webpack`) to produce a single optimized file.

### 3. Configure `.vscodeignore`
Create a `.vscodeignore` file in the sample extension's root to prevent packaging heavy local build caches, source codes, and config files:
```text
.vscode/**
src/**
wit/**
target/**
Cargo.*
tsconfig.json
node_modules/**
```

### 4. Package the Extension
Run the pack command in the extension directory:
```bash
vsce package
```
This will compile the extension and generate a `.vsix` file (e.g., `my-extension-1.0.0.vsix`).

### 5. Verify the VSIX Bundle
Always verify your package locally before uploading:
1.  Open VS Code.
2.  Go to **Extensions** (`Ctrl+Shift+X`).
3.  Click the `...` menu (top right of panel) and select **Install from VSIX...**.
4.  Select the generated `.vsix` file and verify that the commands, UI, and WASM calculations function correctly.

### 6. Publish to the Marketplace
Create a publisher account on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/) and acquire a Personal Access Token (PAT) from Azure DevOps.
Publish the extension using the CLI:
```bash
vsce publish -p <YOUR_MARKETPLACE_PAT>
```

---

## 🎨 Tooling and Maintenance Commands
- Format codebase: `bun run format-all`
- Lint codebase: `bun run lint-all`
