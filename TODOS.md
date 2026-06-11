# 📝 Development Roadmap & TODOs

## ✅ Completed Features
- [x] **EXBA (Extended Browser API)**: Signal-based reactivity engine and `ExbaComponent` base class.
- [x] **Rust-WASM Integration**: Core engine for metrics and fuzzy search scoring.
- [x] **Reactive SVG Charts**: Real-time growth curves calculated in Rust and rendered via SVG Web Components.
- [x] **Multi-Layer Testing Suite**: Unit tests for Rust and Vitest for the EXBA logic.
- [x] **High-Performance Bundling**: Rspack and Rsbuild integration for ultra-fast dev cycles.

## 🛠️ Upcoming Webview Enhancements
- [ ] **EXBA DOM Reconciliation**: Upgrade `innerHTML` rendering to a more efficient template-to-node patcher (similar to `lit-html`).
- [ ] **Declarative Event Handlers**: Support attributes like `@click` to simplify event binding in `ExbaComponent`.
- [ ] **Theming Engine**: Deep integration with VS Code's CSS variables (`--vscode-editor-foreground`, etc.).

## 🦀 Rust WASM Core Roadmap
- [ ] **Binary Communication**: Move from JSON to Bincode or Protocol Buffers for even faster JS/WASM data exchange.
- [ ] **Parallel Processing**: Explore WASM threads for ultra-heavy background calculations.
- [ ] **Advanced Algorithms**: Implement more complex fuzzy matching (e.g., Jaro-Winkler) and cache result scoring.

## 🔌 VS Code Integration
- [ ] **Workspace Listeners**: Auto-refresh dashboard when specific workspace files change.
- [ ] **Language Server**: Connect the Rust engine to a Language Server to provide diagnostics based on WASM logic.
- [ ] **Status Bar Integration**: Expose WASM-calculated metrics directly in the VS Code status bar.

## 📦 Tooling & DevOps
- [ ] **CI/CD Pipeline**: Automated GitHub Action to compile Rust, bundle JS, and package `.vsix`.
- [ ] **Package Script**: Local script to bundle the extension without global `vsce` dependency.
