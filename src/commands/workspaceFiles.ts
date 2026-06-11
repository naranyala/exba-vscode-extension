import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

export function registerWorkspaceShowcase(context: vscode.ExtensionContext) {
    // Workspace folder display (low priority, just informational)
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
    statusBarItem.tooltip = "Current workspace folder";

    context.subscriptions.push(
        statusBarItem,
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            updateStatusBarItem();
        }),
    );

    function updateStatusBarItem() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (statusBarItem) {
            statusBarItem.text = workspaceFolder
                ? `$(folder) ${path.basename(workspaceFolder.uri.fsPath)}`
                : "$(folder) No Workspace";
            statusBarItem.show();
        }
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            updateStatusBarItem();
        }),
    );

    updateStatusBarItem();
    statusBarItem.show();

    // 2. Commands

    // Command: List Workspace Files (using File System API)
    context.subscriptions.push(
        vscode.commands.registerCommand("exba.listWorkspaceFiles", async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage("No workspace folder is open.");
                return;
            }

            const rootPath = workspaceFolders[0].uri.fsPath;
            const files = await listFilesRecursive(rootPath);

            const fileList = files.map((f) => path.relative(rootPath, f)).join("\n");

            const panel = vscode.window.createWebviewPanel(
                "workspaceFiles",
                "Workspace File Explorer",
                vscode.ViewColumn.Two,
                { enableScripts: true },
            );

            panel.webview.html = `
                <html>
                <head>
                    <style>
                        body { font-family: sans-serif; padding: 20px; color: var(--vscode-foreground); }
                        h1 { font-size: 1.2rem; color: var(--vscode-textLink); }
                        pre { background: var(--vscode-editor-background); padding: 10px; border-radius: 4px; overflow: auto; }
                    </style>
                </head>
                <body>
                    <h1>Files in ${path.basename(rootPath)}</h1>
                    <pre>${fileList || "No files found."}</pre>
                </body>
                </html>
            `;
        }),
    );

    // Command: Insert Snippet (using Text Editor API)
    context.subscriptions.push(
        vscode.commands.registerCommand("exba.insertSnippet", async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage("No active editor found.");
                return;
            }

            const snippet = `\n// --- Inserted by Showcase Extension ---\nfunction helloWorld() {\n    console.log("Hello from the VS Code API showcase!");\n}\n`;

            editor
                .edit((editBuilder) => {
                    editBuilder.insert(editor.selection.active, snippet);
                })
                .then((success) => {
                    if (success) {
                        vscode.window.showInformationMessage("Snippet inserted successfully!");
                    }
                });
        }),
    );

    // Command: Prompt with Actions (using Window API)
    context.subscriptions.push(
        vscode.commands.registerCommand("exba.showAdvancedPrompt", async () => {
            const selection = await vscode.window.showQuickPick(
                ["Option A", "Option B", "Cancel"],
                {
                    placeHolder: "Choose an action to demonstrate the QuickPick API",
                },
            );

            if (selection === "Option A") {
                vscode.window.showInformationMessage("You selected Option A");
            } else if (selection === "Option B") {
                vscode.window.showWarningMessage("You selected Option B (Warning!)");
            }
        }),
    );
}

async function listFilesRecursive(dir: string): Promise<string[]> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const res = path.resolve(dir, entry.name);
            return entry.isDirectory() ? listFilesRecursive(res) : res;
        }),
    );
    return Array.prototype.concat(...files);
}
