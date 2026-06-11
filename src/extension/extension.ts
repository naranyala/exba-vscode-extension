import * as vscode from "vscode";
import { registerHelloWorld } from "../commands/helloWorld";
import { registerWorkspaceShowcase } from "../commands/workspaceFiles";
import { registerWebviewDemo } from "../webviews/catDemo";
import { registerWasmDashboard } from "../webviews/dashboard";
import { registerTreeView } from "./treeView";

function createStatusBarItems(context: vscode.ExtensionContext) {
    console.log("📊 Creating status bar items...");

    // Status bar item for toggling sidebar
    const sidebarToggle = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    sidebarToggle.name = "EXBA Sidebar Toggle";
    sidebarToggle.command = "exba.toggleSidebarView";
    sidebarToggle.text = "$(sidebar-toggle)";
    sidebarToggle.tooltip = "Toggle EXBA Sidebar";
    sidebarToggle.show();
    context.subscriptions.push(sidebarToggle);
    console.log("✅ Sidebar toggle created");

    // Status bar item for dashboard panel
    const dashboardToggle = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    dashboardToggle.name = "EXBA Dashboard Toggle";
    dashboardToggle.command = "exba.focusDashboardView";
    dashboardToggle.text = "$(dashboard) EXBA Dashboard";
    dashboardToggle.tooltip = "Open/Focus EXBA Dashboard Panel";
    dashboardToggle.show();
    context.subscriptions.push(dashboardToggle);
    console.log("✅ Dashboard toggle created");

    // Tiny toggle for the right-side panel
    let rightPanelVisible = false;

    const rightPanelToggle = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
    rightPanelToggle.name = "Right Panel";
    rightPanelToggle.command = "exba.toggleRightPanel";
    rightPanelToggle.text = "$(layout-sidebar-right)";
    rightPanelToggle.tooltip = "Show Right Panel";
    rightPanelToggle.show();
    context.subscriptions.push(rightPanelToggle);

    context.subscriptions.push(
        vscode.commands.registerCommand("exba.toggleRightPanel", () => {
            rightPanelVisible = !rightPanelVisible;
            rightPanelToggle.tooltip = rightPanelVisible ? "Hide Right Panel" : "Show Right Panel";
            vscode.commands.executeCommand("workbench.action.toggleRightSideBarVisibility");
        }),
    );
    console.log("✅ Right sidebar toggle created");

    return { sidebarToggle, dashboardToggle, rightPanelToggle };
}

export function activate(context: vscode.ExtensionContext) {
    console.log("🚀 Unified VS Code Extension activating...");

    try {
        // Hide tree view from sidebar so webview takes full space
        vscode.commands.executeCommand("setContext", "exba.showNodeDependencies", false);

        // Create status bar items first
        console.log("📌 Setting up status bar...");
        createStatusBarItems(context);

        // Activate individual showcases/features
        console.log("📝 Registering Hello World command...");
        registerHelloWorld(context);

        console.log("🌳 Registering Tree View...");
        registerTreeView(context);

        console.log("🐱 Registering Webview Demo...");
        registerWebviewDemo(context);

        console.log("📊 Registering WASM Dashboard...");
        registerWasmDashboard(context);

        console.log("📂 Registering Workspace Showcase...");
        registerWorkspaceShowcase(context);

        console.log("✅ All features registered successfully");

        // Show a notification to confirm extension is active
        vscode.window.showInformationMessage("✨ EXBA Extension Loaded Successfully!");

        // Open the sidepanel (Dashboard Explorer) on activation
        // Use setTimeout to ensure views are fully initialized
        setTimeout(() => {
            console.log("🎯 Attempting to focus EXBA Dashboard view...");
            vscode.commands
                .executeCommand("exba.dashboardView.focus")
                .then(() => console.log("✅ Dashboard view focused successfully"))
                .catch((err) => console.error("❌ Failed to focus dashboard view:", err));
        }, 1000);
    } catch (error) {
        console.error("❌ Extension activation failed:", error);
        vscode.window.showErrorMessage(`Extension activation failed: ${error}`);
    }
}

export function deactivate() {
    console.log("👋 Unified VS Code Extension Sample is now deactivated.");
}
