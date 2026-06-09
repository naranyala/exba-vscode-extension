export interface Sample {
	readonly description: string;
	readonly path: string;
	readonly guide: string | null;
	readonly apis: readonly string[];
	readonly contributions: readonly string[];
	readonly excludeFromReadme?: boolean;
}

export const samples: Sample[] = [
	{
		description: 'Webview Sample',
		path: 'webview-sample',
		guide: '/api/extension-guides/webview',
		apis: ['window.createWebviewPanel', 'window.registerWebviewPanelSerializer'],
		contributions: []
	},
	{
		description: 'Tree View Sample',
		path: 'tree-view-sample',
		guide: '/api/extension-guides/tree-view',
		apis: ['window.createTreeView', 'window.registerTreeDataProvider', 'TreeView', 'TreeDataProvider'],
		contributions: ['views', 'viewsContainers']
	},
	{
		description: 'Hello World Sample',
		path: 'helloworld-sample',
		guide: '/api/get-started/extension-anatomy',
		apis: [],
		contributions: [],
		excludeFromReadme: true
	},
	{
		description: 'WASM Component Model Sample',
		path: 'wasm-component-model',
		guide: null,
		apis: [],
		contributions: [],
		excludeFromReadme: true
	},
	{
		description: 'WASM Web Component Framework',
		path: 'wasm-webcomponent-webview-sample',
		guide: null,
		apis: [],
		contributions: [],
		excludeFromReadme: true
	}
];

export const lspSamples: Sample[] = [
	{
		description: 'LSP Sample',
		path: 'lsp-sample',
		guide: '/api/language-extensions/language-server-extension-guide',
		apis: [],
		contributions: []
	}
];
