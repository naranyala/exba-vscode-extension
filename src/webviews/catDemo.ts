import * as vscode from "vscode";

export function registerWebviewDemo(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand("exba.showWebview", () => {
            const panel = vscode.window.createWebviewPanel(
                "catWebview",
                "Webview Demo (Cat)",
                vscode.ViewColumn.One,
                {},
            );

            // Get path to disk resource
            const onDiskPath = vscode.Uri.joinPath(context.extensionUri, "media", "cat.gif");
            const catGifUri = panel.webview.asWebviewUri(onDiskPath);

            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Cat Webview</title>
                    <style>
                        body {
                            font-family: sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            background-color: #1a1a1a;
                            color: #ffffff;
                            margin: 0;
                        }
                        h1 {
                            color: #a78bfa;
                        }
                        img {
                            max-width: 80%;
                            border-radius: 8px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                        }
                    </style>
                </head>
                <body>
                    <h1>Hello from the Webview!</h1>
                    <p>This is a basic HTML Webview rendering a local asset.</p>
                    <img src="${catGifUri}" alt="Cat Coding" />
                </body>
                </html>
            `;
        }),
    );
}
