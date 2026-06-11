import { ExbaComponent, memo, signal } from "../core/exba";
import { callWasm, passStringToWasm } from "../core/utils";

// 1. Create reactive signals shared by all components
export const [getUsers, setUsers] = signal(25000);
export const [getConversion, setConversion] = signal(3.5);
export const [getSpend, setSpend] = signal(55);
export const [getGrowth, setGrowth] = signal(18);
export const [getTab, setTab] = signal<"dashboard" | "explorer">("explorer");
export const [getSearch, setSearch] = signal("");

// WASM readiness signal
export const [getWasmReady, setWasmReady] = signal(false);

// Grid menu signals (isolated for sidepanel)
export const [getGridSearch, setGridSearch] = signal("");

export interface TabItem {
    name: string;
    icon: string;
    category: string;
    description: string;
    tags: string[];
}
export const [getOpenTabs, setOpenTabs] = signal<TabItem[]>([]);
export const [getActiveTabName, setActiveTabName] = signal<string>("home");

export interface ExtensionItem {
    name: string;
    description: string;
    category: string;
    icon: string;
    tags: string[];
}

export const EXTENSIONS: ExtensionItem[] = [
    {
        name: "Rust Analyzer",
        description: "Advanced compiler support, linting, and diagnostics for Rust.",
        category: "Languages",
        icon: "🦀",
        tags: ["rust", "analyzer", "compiler"],
    },
    {
        name: "GitLens",
        description: "Supercharge Git inside VS Code with inline blame annotations.",
        category: "Version Control",
        icon: "🌀",
        tags: ["git", "history", "blame"],
    },
    {
        name: "Prettier",
        description: "Opinionated code formatter supporting TS, JS, CSS, and HTML.",
        category: "Formatting",
        icon: "✨",
        tags: ["format", "prettier", "code-style"],
    },
    {
        name: "Docker UI",
        description: "Manage containers, build images, and inspect networks from a sidebar.",
        category: "Containers",
        icon: "🐳",
        tags: ["docker", "containers", "devops"],
    },
    {
        name: "Database Explorer",
        description: "Connect to PostgreSQL, MySQL, and SQLite databases directly.",
        category: "Database",
        icon: "🗄️",
        tags: ["sql", "postgres", "database", "sqlite"],
    },
    {
        name: "Theme Designer",
        description: "Live preview and compile custom editor color palettes.",
        category: "Aesthetics",
        icon: "🎨",
        tags: ["theme", "styles", "colors", "css"],
    },
];

// Grid Menu items for EXBA sidepanel
export interface GridItem {
    name: string;
    description: string;
    category: string;
    icon: string;
    tags: string[];
    action: string;
}

export const GRID_ITEMS: GridItem[] = [
    {
        name: "Accordion Component",
        description: "Collapsible accordion component with declarative templates.",
        category: "Component Examples",
        icon: "🧩",
        tags: ["accordion", "components", "web", "shadow-dom"],
        action: "extensionAction",
    },
    {
        name: "TreeView Component",
        description: "Recursive folder tree component with stateful expansion.",
        category: "Component Examples",
        icon: "🌳",
        tags: ["treeview", "recursive", "components", "shadow-dom"],
        action: "extensionAction",
    },
    {
        name: "Kanban Board",
        description: "Stateful Kanban board with columns, card movement, and task creation.",
        category: "Component Examples",
        icon: "📋",
        tags: ["kanban", "board", "cards", "stateful"],
        action: "extensionAction",
    },
    {
        name: "Calendar Date Picker",
        description: "Monthly calendar grid picker with month navigation and selected state.",
        category: "Component Examples",
        icon: "📅",
        tags: ["calendar", "datepicker", "date", "monthly"],
        action: "extensionAction",
    },
    {
        name: "Geolocation API",
        description: "Request and display real-time GPS coordinate data.",
        category: "Browser API",
        icon: "📍",
        tags: ["geolocation", "gps", "location", "browser"],
        action: "extensionAction",
    },
    {
        name: "Notification API",
        description: "Send native desktop toast/banner notifications.",
        category: "Browser API",
        icon: "🔔",
        tags: ["notification", "toast", "banner", "browser"],
        action: "extensionAction",
    },
    {
        name: "Local Storage API",
        description: "Save, retrieve and sync persistent key-value data.",
        category: "Browser API",
        icon: "💾",
        tags: ["storage", "localstorage", "persist", "browser"],
        action: "extensionAction",
    },
    {
        name: "Web Share API",
        description: "Invoke the native OS sharing dialog for links/text.",
        category: "Browser API",
        icon: "📤",
        tags: ["share", "webshare", "native", "browser"],
        action: "extensionAction",
    },
    // Component Integration demos
    {
        name: "Leaflet Demo",
        description: "Interactive map using Leaflet.js library.",
        category: "Component Integration",
        icon: "🗺️",
        tags: ["leaflet", "map", "interactive"],
        action: "extensionAction",
    },
    {
        name: "Vis Network Demo",
        description: "Mind‑map style network visualization with vis‑network.",
        category: "Component Integration",
        icon: "🧠",
        tags: ["vis", "network", "mindmap"],
        action: "extensionAction",
    },
];

// Define Memos (Derived State)
export const getMetrics = memo(() => {
    getWasmReady();
    const wasm = (ExbaComponent as any).wasm;
    if (!wasm) return null;
    return callWasm(
        wasm,
        "calculate_metrics",
        getUsers(),
        getConversion(),
        getSpend(),
        getGrowth(),
    );
});

export const getChartData = memo(() => {
    getWasmReady();
    const wasm = (ExbaComponent as any).wasm;
    const metrics = getMetrics();
    if (!wasm || !metrics) return [];
    return callWasm(wasm, "generate_chart_data", metrics.monthlyRevenue, getGrowth()) as {
        x: number;
        y: number;
    }[];
});

export const getFilteredExtensions = memo(() => {
    getWasmReady();
    const wasm = (ExbaComponent as any).wasm;
    const search = getSearch().toLowerCase().trim();
    if (!wasm) return [];

    return EXTENSIONS.map((ext) => {
        if (!search) return { ...ext, score: 100 };

        const [qPtr, qLen] = passStringToWasm(wasm, search);
        const targetText = `${ext.name} ${ext.description} ${ext.category} ${ext.tags.join(" ")}`;
        const [tPtr, tLen] = passStringToWasm(wasm, targetText);

        const score = wasm.score_search(qPtr, qLen, tPtr, tLen);
        wasm.dealloc(qPtr, qLen);
        wasm.dealloc(tPtr, tLen);

        return { ...ext, score };
    })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
});

export const getFilteredGridItems = memo(() => {
    getWasmReady();
    const wasm = (ExbaComponent as any).wasm;
    const search = getGridSearch().toLowerCase().trim();
    if (!wasm) return [];

    return GRID_ITEMS.map((item) => {
        if (!search) return { ...item, score: 100 };

        const [qPtr, qLen] = passStringToWasm(wasm, search);
        const targetText = `${item.name} ${item.description} ${item.category} ${item.tags.join(" ")}`;
        const [tPtr, tLen] = passStringToWasm(wasm, targetText);

        const score = wasm.score_search(qPtr, qLen, tPtr, tLen);
        wasm.dealloc(qPtr, qLen);
        wasm.dealloc(tPtr, tLen);

        return { ...item, score };
    })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
});

export interface TreeNode {
    name: string;
    children?: TreeNode[];
}
