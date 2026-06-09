# Slim VS Code Extension Starter Kit

This repository is a curated, streamlined starter kit for building VS Code extensions, featuring standard TypeScript extensions, Webviews, Language Servers, and Rust WebAssembly integrations.

## 📦 Included Samples

| Category | Sample | Description & APIs |
| -------- | ------ | ------------------ |
| **Basic** | [Hello World](helloworld-sample) | The baseline starter project explaining VS Code extension anatomy. |
| **UI** | [Tree View](tree-view-sample) | Shows how to contribute custom sidebar and explorer tree views. |
| **Rich UI** | [Webview Sample](webview-sample) | Embed custom web UIs using HTML/CSS inside VS Code webview panels. |
| **Language** | [LSP Sample](lsp-sample) | Illustrates how to integrate a Language Server Protocol (LSP) analyzer. |
| **WebAssembly** | [WASM Component Model](wasm-component-model) | Integrates Rust compiled to WASM using the Component Model. |
| **Custom Web** | [WASM Web Component Framework](wasm-webcomponent-webview-sample) | A custom, reactive browser Web Component framework utilizing Rust WASM core. |

---

## 🚀 How to Run Locally

This codebase has been optimized to use the **Bun** runtime for lightning-fast speeds.

1. Install all dependencies:
   ```bash
   bun install
   ```
2. Build all samples:
   ```bash
   bun run compile-all
   ```
3. Open any sample folder in VS Code, install dependencies locally, and press **F5** to run the extension host.

---

## 🎨 Tooling and Code Style
All projects use standard linting and formatting configured at the monorepo root:
- Format codebase: `bun run format-all`
- Lint codebase: `bun run lint-all`
