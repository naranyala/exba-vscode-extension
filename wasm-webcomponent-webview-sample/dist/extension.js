"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var fs = __toESM(require("fs"));
function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-samples.wasm-webcomponent-webview.show", () => {
      DashboardPanel.createOrShow(context.extensionUri);
    })
  );
}
var DashboardPanel = class _DashboardPanel {
  static currentPanel;
  static viewType = "wasmDashboard";
  _panel;
  _extensionUri;
  _disposables = [];
  static createOrShow(extensionUri) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : void 0;
    if (_DashboardPanel.currentPanel) {
      _DashboardPanel.currentPanel._panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      _DashboardPanel.viewType,
      "WASM Web Component Dashboard",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "dist"),
          vscode.Uri.joinPath(extensionUri, "target")
        ]
      }
    );
    _DashboardPanel.currentPanel = new _DashboardPanel(panel, extensionUri);
  }
  constructor(panel, extensionUri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }
  dispose() {
    _DashboardPanel.currentPanel = void 0;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
  _update() {
    const webview = this._panel.webview;
    const scriptPath = vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "bundle.js");
    const cssPath = vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "index.css");
    const wasmPath = vscode.Uri.joinPath(this._extensionUri, "target", "wasm32-unknown-unknown", "debug", "dashboard_engine.wasm");
    const scriptUri = webview.asWebviewUri(scriptPath);
    const cssUri = webview.asWebviewUri(cssPath);
    const wasmUri = webview.asWebviewUri(wasmPath);
    const htmlPath = vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "index.html");
    let htmlContent = fs.readFileSync(htmlPath.fsPath, "utf8");
    htmlContent = htmlContent.replace("bundle.js", scriptUri.toString()).replace("index.css", cssUri.toString());
    this._panel.webview.html = htmlContent.replace(
      "<body>",
      `<body data-wasm-uri="${wasmUri.toString()}">`
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
//# sourceMappingURL=extension.js.map
