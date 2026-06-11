# 🦀 Unified VS Code Extension: EXBA Starter

A professional-grade VS Code extension starter leveraging **EXBA (Extended Browser API)**: Native Web Components, Signal-based reactivity, and a Rust-WASM core engine.

## 🚀 Key Features

- **EXBA Framework**: A reactive, lightweight framework built on native browser APIs for maximum performance and minimal memory footprint.
- **Rust-WASM Core**: Offloads heavy computation (fuzzy search, financial modeling, data processing) to a high-performance Rust engine.
- **Signal Reactivity**: Granular, dependency-tracking state management (similar to SolidJS) implemented in a tiny ~50 line runtime.
- **SVG Charting**: Real-time, reactive SVG growth curves calculated entirely in Rust and rendered via native Web Components.
- **Full-Stack Testing**: 
  - **Rust**: Native unit tests for the core engine.
  - **Webview**: Vitest + Happy DOM for component and reactivity testing.
  - **Extension**: VS Code integration testing.
- **Modern Tooling**: Powered by **Bun**, **Rspack**, and **Rsbuild** for near-instant build times.

## 🧪 Testing

The project features a multi-layered testing strategy to ensure stability across the entire stack.

### 1. Rust Engine (Logic)
Unit tests for the Rust-WASM core are written in native Rust and run in the standard environment.
```bash
bun run test:rust
```

### 2. Webview (UI & Reactivity)
The EXBA framework and web components are tested using **Vitest** and **Happy DOM**.
```bash
bun run test:webview
```
*Tests signals, memos, lifecycle hooks, and component rendering.*

### 3. VS Code Extension (Integration)
Integration tests that run inside a real VS Code instance.
```bash
bun run test:vscode
```

### 4. Run All Tests
```bash
bun run test
```

## 🏗️ Architecture

### 1. Webview (The Display)
Located in `src/webview`, the UI is built using the **EXBA** library.
- **ExbaComponent**: The base class for all UI elements.
- **Isolation**: Uses **Shadow DOM** to ensure extension styles never leak or conflict with VS Code.
- **Reactivity**: Components are automatically kept in sync with **Signals**. When a signal updates, only the components using that signal re-render.

### 2. Rust Engine (The Brain)
Located in `src/rust`, this module is compiled to WebAssembly.
- **Logic**: Handles fuzzy scoring for search, complex projections, and data serialization via **Serde**.
- **Efficiency**: Communicates with JavaScript via shared memory buffers and JSON.

### 3. Extension Host (The Glue)
The standard VS Code extension layer that manages webview panels, tree views, and commands.

## 🛠️ Getting Started

### Prerequisites
- [Bun](https://bun.sh/)
- [Rust & Cargo](https://rustup.rs/) (with `wasm32-unknown-unknown` target)

### Installation
```bash
bun install
rustup target add wasm32-unknown-unknown
```

### Development
```bash
# Build everything (Rust + JS)
bun run build

# Run Tests
bun run test         # Runs both Rust and Webview tests
bun run test:rust    # Rust only
bun run test:webview # Vitest only
```

### Running Locally
1. **Build the extension**: Ensure the `dist` folder is populated by running `bun run build`.
2. **Open in VS Code**: Open this project folder in VS Code.
3. **Launch**: Press `F5` (or go to the **Run and Debug** view and click **Run Extension**). This will open a new "Extension Development Host" window with the extension active.
4. **Trigger Commands**: In the new window, open the Command Palette (`Ctrl+Shift+P`) and search for `Samples: WASM Web Component Dashboard`.

### Packaging for Manual Install
If you want to install the extension permanently in your local VS Code:
1. **Package**: Run `npx @vscode/vsce package` to generate a `.vsix` file.
2. **Install**: Open the Extensions view in VS Code, click the `...` (Views and More Actions), and select **Install from VSIX...**.

## 📜 Scripts Reference

- `build`: Full production build.
- `lint`/`format`: Code quality via Biome.
- `test`: Comprehensive testing suite.

## 📄 License
MIT
