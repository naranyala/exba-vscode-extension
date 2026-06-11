# 📝 Development Roadmap & TODOs

## ✅ Completed Features
- [x] **EXBA (Extended Browser API)**: Signal-based reactivity engine and `ExbaComponent` base class.
- [x] **Rust-WASM Integration**: Core engine for metrics and fuzzy search scoring.
- [x] **Reactive SVG Charts**: Real-time growth curves calculated in Rust and rendered via SVG Web Components.
- [x] **Multi-Layer Testing Suite**: Unit tests for Rust and Vitest for the EXBA logic.
- [x] **High-Performance Bundling**: Rspack and Rsbuild integration for ultra-fast dev cycles.
- [x] **Codebase Architecture Reorganization**: Separated Rust core (`rust/`) and Webview frontend (`webview/`) to the root directory, with modular backend structures (`src/extension`, `src/commands`, `src/webviews`).
- [x] **Visual Layout Toggle Buttons**: Added layout buttons on the Editor Title bar and Sidebar header.
- [x] **Status Bar Toggles**: Introduced bottom status bar toggle buttons to show/hide the sidebar and the EXBA Dashboard Panel.
- [x] **Unified EXBA Naming**: Updated all commands to follow the `exba.*` identifier scheme and `EXBA` category namespace.
- [x] **Developer Hot-Loading Script**: Added a custom `bun run launch` pipeline to build, link, and run/reload VSCodium/Cursor instantly.
- [x] **Linter Green Codebase**: Cleared all Biome formatting and linting errors.

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

## 📦 Tooling & DevOps
- [ ] **CI/CD Pipeline**: Automated GitHub Action to compile Rust, bundle JS, and package `.vsix`.
