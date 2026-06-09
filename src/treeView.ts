import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function registerTreeView(context: vscode.ExtensionContext) {
    const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;

    const nodeDependenciesProvider = new NodeDependenciesProvider(rootPath);
    
    // Register our Tree Data Provider under the view id matching the package.json contribution
    vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
    
    context.subscriptions.push(
        vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.refresh())
    );
}

class NodeDependenciesProvider implements vscode.TreeDataProvider<Dependency> {
    private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | null | void> = new vscode.EventEmitter<Dependency | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string | undefined) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Dependency): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Dependency): Thenable<Dependency[]> {
        if (!this.workspaceRoot) {
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve([]);
        } else {
            const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
            if (this.pathExists(packageJsonPath)) {
                return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
            } else {
                return Promise.resolve([]);
            }
        }
    }

    private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
        if (this.pathExists(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

            const toDep = (depName: string, version: string, isDev: boolean): Dependency => {
                return new Dependency(
                    depName,
                    version,
                    isDev ? 'devDependency' : 'dependency',
                    vscode.TreeItemCollapsibleState.None
                );
            };

            const deps = packageJson.dependencies
                ? Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep], false))
                : [];
            const devDeps = packageJson.devDependencies
                ? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep], true))
                : [];
            return deps.concat(devDeps);
        } else {
            return [];
        }
    }

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }
}

class Dependency extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private version: string,
        private type: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}-${this.version}`;
        this.description = `${this.version} (${this.type})`;
    }
}
