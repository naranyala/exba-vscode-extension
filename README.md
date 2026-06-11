# 🦀 Unified VS Code Extension: EXBA Starter

A professional-grade VS Code and VSCodium extension starter leveraging **EXBA (Extended Browser API)**: Native Web Components, Signal-based reactivity, and a Rust-WASM core engine.

---

## 🚀 Key Features

- **EXBA Framework**: A reactive, lightweight frontend framework built on native browser APIs for maximum performance and minimal memory footprint.
- **Rust-WASM Core**: Offloads heavy computation (fuzzy search, statistical modeling, data processing) to a high-performance Rust engine.
- **Signal Reactivity**: Granular, dependency-tracking state management implemented in a tiny runtime.
- **Visual Toggle Commands**:
  - **Status Bar buttons**: A bottom status bar toggle displaying the workspace folder name to open the sidebar, and a dedicated `$(dashboard) EXBA Dashboard` button to toggle the dashboard.
  - **Editor Title Bar button**: An icon button pinned to the top-right toolbar of all open files to toggle the dashboard.
  - **Sidebar title bar button**: A toggle button pinned directly to the tree view's header.
- **Full-Stack Testing**: 
  - **Rust**: Native unit tests for the core engine.
  - **Webview**: Vitest + Happy DOM for component and reactivity testing.
- **Modern Tooling**: Powered by **Bun**, **Rspack**, and **Rsbuild** for near-instant build times.
- **Developer Hot-Loading**: Local symlinking command `bun run launch` that builds, links, and launches VSCodium automatically with hot-reload support.

---

## 🏗️ Codebase Architecture

The project has been reorganized into a highly maintainable, modular structure:

```
.
├── bin/                       # Build and helper scripts (build.js, link-extension.js, launch.js)
├── rust/                      # Pure Rust-WASM Core Engine
│   ├── src/lib.rs
│   └── Cargo.toml
├── webview/                   # Webview Browser Frontend
│   ├── core/                  # EXBA Reactivity Framework & VS Code Messaging
│   │   ├── exba.ts
│   │   ├── vscode-service.ts
│   │   └── utils.ts
│   ├── components/            # Custom Web Component UI Views
│   │   └── app-component.ts
│   ├── tests/                 # Webview Frontend tests (Vitest + Happy DOM)
│   │   ├── component.test.ts
│   │   ├── exba.test.ts
│   │   └── utils.test.ts
│   ├── index.html             # HTML Shell
│   └── index.css              # Custom styling
└── src/                       # VS Code Extension Host Backend
    ├── extension/             # Core extension activation and tree provider
    │   ├── extension.ts
    │   └── treeView.ts
    ├── commands/              # Modular backend VS Code commands
    │   ├── helloWorld.ts
    │   └── workspaceFiles.ts
    └── webviews/              # Webview panel host controllers
        ├── catDemo.ts
        └── dashboard.ts
```

---

## 🛠️ Getting Started

### Prerequisites
- [Bun](https://bun.sh/)
- [Rust & Cargo](https://rustup.rs/) (with `wasm32-unknown-unknown` target)

### Installation
```bash
bun install
rustup target add wasm32-unknown-unknown
```

### Development & Hot-Loading
The easiest way to build, install, and run this extension locally:
```bash
bun run launch
```
This single command compiles the Rust WASM module, bundles the extension/webview components, links the extension to VSCodium / Cursor, and launches VSCodium in the workspace folder.

---

## 🧪 Testing

The project features a multi-layered testing strategy to ensure stability across the entire stack.

### 1. Rust Engine (Logic)
```bash
bun run test:rust
```

### 2. Webview (UI & Reactivity)
```bash
bun run test:webview
```

### 3. Run All Tests
```bash
bun run test
```

---

## 📜 Scripts Reference

- `build`: Full production build (Rust WASM compilation + Rspack Extension bundling + Rsbuild Webview bundling).
- `launch`: Rebuild, link to local editors, and launch/reload VSCodium.
- `link:local`: Generates symlinks in your Cursor and VS Code OSS extension directories.
- `lint`/`format`/`check`: Code quality check and auto-formatting via Biome.
- `test`: Comprehensive testing suite (Rust + Vitest).
- `test:rust`: Runs native Rust cargo tests.
- `test:webview`: Runs Vitest tests for the webview components.

---

## 📄 License
MIT
