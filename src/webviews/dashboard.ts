import * as fs from "node:fs";
import * as vscode from "vscode";

export function registerWasmDashboard(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand("exba.showDashboard", () => {
            WasmDashboardPanel.createOrShow(context.extensionUri);
        }),
    );
}

class WasmDashboardPanel {
    public static currentPanel: WasmDashboardPanel | undefined;
    public static readonly viewType = "wasmDashboard";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (WasmDashboardPanel.currentPanel) {
            WasmDashboardPanel.currentPanel.dispose();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            WasmDashboardPanel.viewType,
            "WASM Web Component Dashboard",
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, "dist")],
            },
        );

        WasmDashboardPanel.currentPanel = new WasmDashboardPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case "showNotification":
                        vscode.window.showInformationMessage(message.payload.message);
                        return;
                    case "log":
                        console.log(`[Webview Log] ${message.payload.message}`);
                        return;
                    case "extensionAction":
                        vscode.window.showInformationMessage(
                            `Action triggered for extension: ${message.payload.name}`,
                        );
                        return;
                }
            },
            null,
            this._disposables,
        );
    }

    public dispose() {
        WasmDashboardPanel.currentPanel = undefined;
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;

        // Resolve resource URIs relative to unified dist folder
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "bundle.js"),
        );
        const cssUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "index.css"),
        );
        const wasmUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "dist", "wasm", "dashboard_engine.wasm"),
        );

        const htmlPath = vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "index.html");
        let htmlContent = fs.readFileSync(htmlPath.fsPath, "utf8");

        // Dynamically inject compiled URIs into index.html shell
        htmlContent = htmlContent
            .replace("bundle.js", scriptUri.toString())
            .replace("index.css", cssUri.toString());

        this._panel.webview.html = htmlContent.replace(
            "<body>",
            `<body data-wasm-uri="${wasmUri.toString()}">`,
        );
    }
}
