# Unified VS Code Extension Starter & Showcase

A comprehensive starter kit and demonstration platform for modern Visual Studio Code extensions. This project showcases advanced extension patterns, including high-performance Rust-powered WebAssembly (WASM) integration within VS Code Webviews and reactive custom web components.

## Overview

This project is designed to serve as a blueprint for developers building sophisticated extensions. It moves beyond basic command implementations to demonstrate how to leverage native performance for heavy computations and modern web technologies for rich, reactive user interfaces within the VS Code environment.

## Key Features

* **Rust-WASM Integration**: Demonstrates how to compile Rust code to WebAssembly and execute it within a VS Code Webview for high-performance data processing.
* **Reactive Web Components**: Showcases a custom-built, signal-based reactivity system implemented using native Web Components for efficient UI updates in Webviews.
* **Advanced UI Patterns**: Implements complex UI elements including a dashboard with real-time metric calculations and an explorer mockup with fuzzy search capabilities.
* **Tree View Implementation**: Demonstrates the integration of custom views into the VS Code Activity Bar and Side Bar.
* **Unified Build Pipeline**: A streamlined build process orchestrated by Bun, leveraging Cargo for Rust/WASM compilation and esbuild for optimized JavaScript bundling.

## Technology Stack

* **Languages**: TypeScript (Extension and Webview), Rust (WASM Engine)
* **Runtime & Tooling**: Bun, Node.js, Cargo
* **Bundler**: esbuild
* **APIs**: VS Code Extension API (Webview, Tree View, Commands)
* **Web Technologies**: Custom Elements, WebAssembly, CSS3 (Flexbox, Grid, Animations)

## Project Structure

```text
.
├── bin/                # Build utility scripts
├── src/
│   ├── extension.ts    # Main extension entry point
│   ├── helloWorld.ts   # Basic command sample
│   ├── treeView.ts     # Tree view implementation
│   ├── wasmDashboard.ts# Webview panel management
│   ├── webviewDemo.ts  # Webview sample implementation
│   ├── rust/           # Rust source code for WASM engine
│   │   └── src/        # Rust logic (metric calculations)
│   └── webview/        # Webview frontend source
│       ├── app-component.ts # Reactive custom elements
│       ├── wasm-framework.ts# WASM integration layer
│       └── ...         # HTML, CSS, and Utils
├── package.json        # Project configuration and scripts
└── tsconfig.json       # TypeScript configuration
```

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:

* **Node.js** (LTS recommended)
* **Bun** (for task orchestration)
* **Rust & Cargo** (for WASM compilation)

### Installation

1. Clone the repository.
2. Install dependencies using Bun:

```bash
bun install
```

### Building the Project

The build process compiles the Rust engine to WASM, bundles the webview assets, and prepares the extension distribution.

```bash
bun run build
```

This command executes:
1. `cargo build --target wasm32-unknown-unknown` to compile the Rust engine.
2. `node ./bin/esbuild.js` to bundle the TypeScript/Webview assets.

### Running and Debugging

1. Open the project in Visual Studio Code.
2. Press `F5` to launch a new VS Code instance with the extension loaded.
3. Use the "Samples" command palette to trigger the different showcases:
    * `Samples: Hello World`
    * `Samples: Webview Demo (Cat)`
    * `Samples: WASM Web Component Dashboard`

## Development Commands

* `bun run build`: Full build of Rust and JS assets.
* `bun run build:rust`: Only build the Rust WASM component.
* `bun run build:js`: Only build the JavaScript/Webview assets.
* `bun run lint`: Run Biome linter.
* `bun run format`: Format code using Biome.
