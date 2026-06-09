# 📝 Development Roadmap & TODOs

This document outlines future enhancement opportunities, refactoring tasks, and feature roadmap items for the VS Code Extension Starter.

---

## 🛠️ Framework & Webview Enhancements

- [ ] **Declarative Event Handlers**:
  Upgrade [wasm-framework.ts](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/src/webview/wasm-framework.ts) to support declarative event attributes (e.g., `@click="handleAction"` or `onclick="${this.bind(this.handler)}"`), removing manual `addEventListener` binding in render loops.
- [ ] **Advanced Fuzzy Search**:
  Integrate a lightweight, zero-dependency fuzzy search algorithm (like a simple Levenshtein distance helper or `fuse.js` port) in [app-component.ts](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/src/webview/app-component.ts) to score and sort search results by relevance rather than simple substring matching.
- [ ] **Interactive Grid Actions**:
  Wire card clicks in the Explorer view to post messages back to the VS Code extension host (`acquireVsCodeApi().postMessage()`) to trigger editor behavior, show notifications, or open details pages.
- [ ] **SVG Chart Components**:
  Build a reusable SVG chart custom element (e.g., `<wasm-chart>`) to render growth projections and statistical charts calculated by the Rust-WASM core.

---

## 🦀 Rust WASM Core Enhancements

- [ ] **Advanced Calculations**:
  Expand [lib.rs](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/src/rust/src/lib.rs) with more complex metrics: compound growth charts, cohort retention curves, or cash-flow modeling.
- [ ] **Data Types Validation**:
  Add validation in the Rust core to ensure numeric values (like negative spends or out-of-bound percentages) return explicit Rust `Result::Err` errors mapped to UI warnings in the webview.
- [ ] **WASM Unit Testing**:
  Set up `wasm-bindgen-test` to execute unit tests on the Rust metrics calculators directly in headless environments.

---

## 🔌 VS Code Integration

- [ ] **Workspace File Listeners**:
  In [treeView.ts](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/src/treeView.ts), register a `vscode.workspace.onDidSaveTextDocument` listener to automatically reload and refresh package dependencies when the workspace `package.json` file is saved.
- [ ] **Add Language Server Diagnostics**:
  Expose a basic autocomplete and diagnostics provider in [extension.ts](file:///media/naranyala/Data/projects-remote/exba-vscode-extension/src/extension.ts) using the newly installed `vscode-languageserver` packages to showcase language integration capabilities.

---

## 📦 Tooling & CI/CD

- [ ] **Local VSCE packaging script**:
  Add a local task runner script to package the extension without needing global npm installs of `@vscode/vsce`.
- [ ] **GitHub Action Pipeline**:
  Set up a GitHub workflow to compile Rust, bundle JS with esbuild, and compile the final `.vsix` artifact on every main branch push.
