# WASM Web Component Dashboard Framework

This directory contains a **custom, reactive Web Component framework** that utilizes a Rust WebAssembly (WASM) calculation engine to power a browser-native Web Component dashboard.

---

## 🌟 Key Features

1. **Proxy-Based Reactivity**: Implements a custom reactive state mechanism (similar to Vue) built directly on top of ES6 Proxies.
2. **Batched Rendering**: Uses `requestAnimationFrame` to batch multiple state mutations, preventing redundant layout thrashing and DOM updates.
3. **Shadow DOM Encapsulation**: Uses browser-native Shadow DOM for style and markup isolation.
4. **Rust WASM Calculations**: Offloads intensive dashboard metrics, projections, and customer churn calculations to a zero-dependency Rust core ([lib.rs](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-webcomponent-webview-sample/src/lib.rs)).

---

## 📂 Architecture & Files

- [wasm-framework.ts](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-webcomponent-webview-sample/src/webview/wasm-framework.ts): The base class `WasmComponent` extending `HTMLElement`. It handles WASM loading, shared memory decoding, and reactivity.
- [app-component.ts](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-webcomponent-webview-sample/src/webview/app-component.ts): The custom element `dashboard-app` subclassing `WasmComponent`. It defines interactive inputs (sliders) and binds them to the WASM metrics generator.
- [lib.rs](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-webcomponent-webview-sample/src/lib.rs): Rust module exposing data calculations. It writes JSON results directly into a shared memory buffer read by JavaScript.
- [index.html](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-webcomponent-webview-sample/src/webview/index.html) & [index.css](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-webcomponent-webview-sample/src/webview/index.css): The container and page-level styling served in the Webview panel.
- [extension.ts](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-webcomponent-webview-sample/src/extension.ts): VS Code extension file that hosts the webview and resolves local resource paths.

---

## 🚀 How to Run and Test

1. Ensure all toolchains (Rust, target `wasm32-unknown-unknown`, and Bun) are set up.
2. Install dependencies:
   ```bash
   bun install
   ```
3. Compile the WASM target and bundle the TypeScript code using esbuild:
   ```bash
   bun run build
   ```
4. Open the [wasm-webcomponent-webview-sample](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/wasm-webcomponent-webview-sample) folder in VS Code.
5. Press **F5** to start the Extension Host.
6. In the new window, run the command **WASM Web Component: Show Dashboard** from the Command Palette.
7. Interact with the metrics sliders; all statistics are updated in real-time, backed by Rust WebAssembly.
