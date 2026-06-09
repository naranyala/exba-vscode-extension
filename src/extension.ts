import type * as vscode from "vscode";
import { registerHelloWorld } from "./helloWorld";
import { registerTreeView } from "./treeView";
import { registerWasmDashboard } from "./wasmDashboard";
import { registerWebviewDemo } from "./webviewDemo";
import { registerWorkspaceShowcase } from "./workspaceShowcase";

export function activate(context: vscode.ExtensionContext) {
    console.log("Unified VS Code Extension Sample is now active.");

    // Activate individual showcases/features
    registerHelloWorld(context);
    registerTreeView(context);
    registerWebviewDemo(context);
    registerWasmDashboard(context);
    registerWorkspaceShowcase(context);
}

export function deactivate() {
    console.log("Unified VS Code Extension Sample is now deactivated.");
}
