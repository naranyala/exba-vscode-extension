import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-samples.wasm-webcomponent-webview.show', () => {
            DashboardPanel.createOrShow(context.extensionUri);
        })
    );
}

class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    public static readonly viewType = 'wasmDashboard';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            DashboardPanel.viewType,
            'WASM Web Component Dashboard',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'dist'),
                    vscode.Uri.joinPath(extensionUri, 'target')
                ]
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        DashboardPanel.currentPanel = undefined;

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
        
        // Local path to main script and css files
        const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'bundle.js');
        const cssPath = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.css');
        const wasmPath = vscode.Uri.joinPath(this._extensionUri, 'target', 'wasm32-unknown-unknown', 'debug', 'dashboard_engine.wasm');

        // Convert uri to webview compatible URI
        const scriptUri = webview.asWebviewUri(scriptPath);
        const cssUri = webview.asWebviewUri(cssPath);
        const wasmUri = webview.asWebviewUri(wasmPath);

        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.html');
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

        // Replace paths in index.html dynamically
        htmlContent = htmlContent
            .replace('bundle.js', scriptUri.toString())
            .replace('index.css', cssUri.toString());

        // Inject the WASM file URI into body dataset
        this._panel.webview.html = htmlContent.replace(
            '<body>',
            `<body data-wasm-uri="${wasmUri.toString()}">`
        );
    }
}
