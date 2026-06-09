import * as vscode from 'vscode';
import { registerHelloWorld } from './features/helloWorld';
import { registerTreeView } from './features/treeView';
import { registerWebviewDemo } from './features/webviewDemo';
import { registerWasmDashboard } from './features/wasmDashboard';

export function activate(context: vscode.ExtensionContext) {
    console.log('Unified VS Code Extension Sample is now active.');

    // Activate individual showcases/features
    registerHelloWorld(context);
    registerTreeView(context);
    registerWebviewDemo(context);
    registerWasmDashboard(context);
}

export function deactivate() {
    console.log('Unified VS Code Extension Sample is now deactivated.');
}
