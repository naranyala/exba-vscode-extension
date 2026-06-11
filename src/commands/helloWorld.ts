import * as vscode from "vscode";

export function registerHelloWorld(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand("exba.helloWorld", () => {
            vscode.window.showInformationMessage("Hello World from the VS Code Extension Starter!");
        }),
    );
}
