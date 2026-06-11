/**
 * A centralized abstraction for the VS Code Webview API.
 * This service provides a type-safe way to communicate with the extension host
 * and manage webview state, while allowing for easy mocking in tests.
 */

export interface WebviewMessage {
    command: string;
    payload?: any;
}

export class VSCodeService {
    private static instance: VSCodeService;
    private vscode: any;

    private constructor() {
        // acquireVsCodeApi can only be called once
        if (typeof acquireVsCodeApi === "function") {
            this.vscode = acquireVsCodeApi();
        } else {
            // Mock for non-VS Code environments (e.g., local browser dev or tests)
            this.vscode = {
                postMessage: (msg: any) => console.log("[MOCK VSCODE] postMessage:", msg),
                getState: () => ({}),
                setState: (state: any) => console.log("[MOCK VSCODE] setState:", state),
            };
        }
    }

    public static getInstance(): VSCodeService {
        if (!VSCodeService.instance) {
            VSCodeService.instance = new VSCodeService();
        }
        return VSCodeService.instance;
    }

    /**
     * Sends a message to the extension host.
     */
    public postMessage(command: string, payload?: any) {
        this.vscode.postMessage({ command, payload });
    }

    /**
     * Get the persistent state for the webview.
     */
    public getState<T>(): T | undefined {
        return this.vscode.getState() as T;
    }

    /**
     * Set the persistent state for the webview.
     */
    public setState<T>(state: T) {
        this.vscode.setState(state);
    }

    /**
     * Helper to show a notification via VS Code.
     */
    public showInformationMessage(message: string) {
        this.postMessage("showNotification", { type: "info", message });
    }

    /**
     * Helper to log data back to the extension host output channel.
     */
    public log(message: string) {
        this.postMessage("log", { message });
    }
}

// Export a singleton instance
export const vscode = VSCodeService.getInstance();

/**
 * Global declaration for the VS Code API bootstrap function.
 */
declare function acquireVsCodeApi(): any;
