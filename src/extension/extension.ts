import type * as vscode from "vscode";
import { registerHelloWorld } from "../commands/helloWorld";
import { registerWorkspaceShowcase } from "../commands/workspaceFiles";
import { registerWebviewDemo } from "../webviews/catDemo";
import { registerWasmDashboard } from "../webviews/dashboard";
import { registerTreeView } from "./treeView";

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
