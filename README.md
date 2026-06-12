# 🦀 EXBA — Meta-Functionality Abstraction

A **VS Code / VSCodium extension** powered by a three-layer meta-functionality stack: **Rust WASM macros**, a **typed TypeScript bridge**, and a **reactive Web Component framework** — all working together so that adding a new WASM-accelerated feature requires minimal boilerplate.

---

## 🧠 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Reactive Framework                  │
│  (exba.ts)                                          │
│  signal · memo · effect · batch · untrack           │
│  ExbaComponent · DOMRenderer · defineComponent      │
│  createList · createShow · createSwitch             │
│  createModel · createResource · createContext       │
│  createPortal · createDeferred · useRef             │
│  onMount · onCleanup · onAfterRender · onError      │
├─────────────────────────────────────────────────────┤
│                Typed WASM Bridge                     │
│  (wasm-bridge.ts)                                   │
│  WasmBridge singleton                               │
│  _callJson<T> · _callInt · _callF64 · _callString   │
│  _passString · _freeString · _readJsonResult        │
│  _validateExports · WASM_FUNCTIONS registry         │
│  calculateMetrics · generateChartData               │
│  scoreSearch · formatText                           │
│  createMockWasmBridge · createMockWasmExports        │
├─────────────────────────────────────────────────────┤
│               Rust WASM Engine                       │
│  (rust/src/)                                        │
│  wasm_export! · wasm_export_with_args!              │
│  wasm_export_int! · wasm_export_f64!                │
│  wasm_export_string!                                │
│  WasmResult<T> · set_json_result · set_error        │
│  init_panic_hook · clear_result_buffer · log         │
│  alloc · dealloc · get_result_ptr · get_result_len   │
│  validate_ptr_range                                  │
└─────────────────────────────────────────────────────┘
```

### Design Goal

A developer adding a new WASM function writes:
1. A `*_pure()` Rust function + test
2. One `wasm_export_*!` macro invocation
3. A typed method on `WasmBridge` (one-liner for JSON returns)
4. A `wasmMemo`-backed getter in `state.ts`
5. (Optional) A reactive component consuming the getter

No manual memory management, no JSON parsing boilerplate, no export sync issues.

---

## 🔩 Layer 1: Rust WASM Engine

### 5 Export Macros (`rust/src/util.rs`)

Every macro shares the identical prologue — `init_panic_hook()` → `clear_result_buffer()` → `log("[WASM] fn_name called")` — then evaluates a `WasmResult<T>` expression:

| Macro | Return Style | TS Helper | Used For |
|---|---|---|---|
| `wasm_export!` | JSON via result buffer | `_callJson` | Paramless JSON-returning fns |
| `wasm_export_with_args!` | JSON via result buffer | `_callJson` | Parametrized JSON-returning fns |
| `wasm_export_int!` | `i32` | `_callInt` | Scalar integer results |
| `wasm_export_f64!` | `f64` | `_callF64` | Scalar float results |
| `wasm_export_string!` | JSON string via result buffer | `_callJson` | String-returning fns |

### Error Handling

```rust
pub type WasmResult<T> = Result<T, WasmError>;
```

Errors are serialized as `{"error": "..."}` JSON and thrown on the JS side. `wasm_export_int!`/`wasm_export_f64!` return `0`/`0.0` on error.

### Modules

| Module | Exports | Description |
|---|---|---|
| `metrics.rs` | `calculate_metrics`, `generate_chart_data` | Business analytics (JSON return) |
| `search.rs` | `score_search` | Fuzzy text scoring (int return) |
| `format.rs` | `format_text` | String formatting (JSON string return) |

### Memory Model

- `alloc`/`dealloc` — linear allocator for cross-boundary strings
- `get_result_ptr`/`get_result_len` — read JSON result buffer
- `clear_result_buffer()` — called before every export body
- `validate_ptr_range` — guards against null/overflow pointers

---

## 🔌 Layer 2: Typed WASM Bridge (`webview/core/wasm-bridge.ts`)

### Singleton Pattern

```typescript
await WasmBridge.instance.init({ wasmUri: "/path/to/engine.wasm", debug: true });
```

`init()` fetches the WASM binary, instantiates with import object (including `js_log`), validates exports against the `WASM_FUNCTIONS` registry, and sets status to `"ready"`.

### Generic Dispatch Helpers

| Helper | Signature | Purpose |
|---|---|---|
| `_callJson<T>` | `(fnName, args) => T` | Call a JSON-returning WASM export, read + parse result buffer |
| `_callInt` | `(fnName, args) => number` | Call a scalar i32-returning export |
| `_callF64` | `(fnName, args) => number` | Call a scalar f64-returning export |

Each throws on error responses (`{"error": "..."}`) from the Rust side.

### String Passing

`_passString(str)` → `[ptr, len]` encodes a JS string into WASM linear memory. `_freeString(ptr, len)` zeros + deallocates. Used by `scoreSearch` and `formatText` with `try/finally` for leak-free cleanup.

### Export Validation

```typescript
const WASM_FUNCTIONS: WasmFnDef[] = [
    { name: "calculate_metrics", returnStyle: "json" },
    { name: "generate_chart_data", returnStyle: "json" },
    { name: "score_search", returnStyle: "int" },
    { name: "format_text", returnStyle: "json" },
];
```

`_validateExports()` runs on `init()` and warns if any expected function is missing — catches Rust/TS desync at load time.

### Public API Methods

| Method | Return Type | Description |
|---|---|---|
| `calculateMetrics(users, conv, spend, growth)` | `MetricsResult` | Business KPIs via `_callJson` |
| `generateChartData(revenue, growth)` | `ChartPoint[]` | 12-month projection via `_callJson` |
| `scoreSearch(query, target)` | `number` | Fuzzy relevance scoring via `_callInt` |
| `formatText(input)` | `FormattedText` | Text case/word-count via `_callJson` |

### Test Utilities (`webview/core/wasm-test-utils.ts`)

```typescript
import { createMockWasmBridge, createMockWasmExports } from "../core/wasm-test-utils";

WasmBridge._setTestingInstance(createMockWasmBridge({
    scoreSearch: (q, t) => t.includes(q) ? 100 : 0,
}));
```

- `createMockWasmExports(overrides?)` — mock exports with sensible defaults
- `createMockWasmBridge(overrides?)` — full bridge mock with method overrides

---

## ⚛️ Layer 3: Reactive Framework (`webview/core/exba.ts`)

### Signals

```typescript
const [getCount, setCount] = signal(0);
setCount(getCount() + 1);
```

Automatic dependency tracking via a global subscriber stack. Batched microtask flushing.

### Derived Values

```typescript
const getDouble = memo(() => getCount() * 2);
```

Re-computes only when dependencies change. Internally uses `effect` + `signal`.

### Effects

```typescript
const stop = effect(() => {
    console.log("Count:", getCount());
});
// stop() to dispose
```

Returns a cleanup function. Effects auto-cleanup before re-running. Nested effects supported.

### Batch & Untrack

```typescript
batch(() => {
    setCount(1);
    setName("foo"); // single re-render
});

untrack(() => getCount()); // read without subscribing
```

### Lifecycle Hooks

| Hook | When | Signature |
|---|---|---|
| `onMount(fn)` | After first render | `() => undefined \| Cleanup` |
| `onCleanup(fn)` | On disconnect | `() => void` |
| `onAfterRender(fn)` | After each DOM patch | `() => void` |
| `onError(fn)` | Error boundary | `(err: unknown) => void` |

`onAfterRender` eliminates `setTimeout(fn, 0)` / `requestAnimationFrame` hacks.

### ExbaComponent

```typescript
class MyComponent extends ExbaComponent {
    styles() { return css`:host { display: block; }`; }
    abstract template(): string; // required
}
```

- Attaches open shadow DOM
- `styles()` + `template()` evaluated in `connectedCallback`
- Render effect auto-started/stopped
- Mount/cleanup/afterRender hooks tracked and disposed on disconnect
- `createAttrSignal(attr, default)` for attribute-driven reactivity
- `static initWasm(uri, debug)` convenience
- Render errors caught and routed through `onError` handler

### DOMRenderer

- Recursive node patching (not full replace)
- Preserves `activeElement` (cursor position, focus)
- Attribute diffing (add/remove/update)
- `on-*` → declarative event binding
- `?attr` → boolean attribute binding
- Input value syncing from `value` attribute

---

## 🧩 Framework Primitives

### createList — Keyed Reconciliation

```typescript
createList(
    () => items.filter(c => c.column === "todo"),
    (item) => item.id,
    (item, i) => { /* build HTMLElement */ },
    () => shadow.querySelector(".todo-cards"),
    { onEnter: (el) => el.animate([{ opacity: 0 }, { opacity: 1 }], 300),
      onLeave: (el) => el.animate([{ opacity: 1 }, { opacity: 0 }], 300) },
);
```

Three-phase algorithm: remove stale → reorder mismatched → insert new. Elements tracked via `data-key` attribute. Optional `onEnter`/`onLeave` transition hooks.

### createShow — Conditional Rendering

```typescript
createShow(getWhen, renderContent, getContainer, renderFallback?, transition?);
```

Shows/hides content based on a boolean signal. Previous content removed before new content appended.

### createSwitch — Multi-way Conditional

```typescript
createSwitch(getKey, cases, getContainer, renderFallback?, transition?);
```

Replaces nested ternaries. Cases keyed by string. Container content replaced on key change.

### createModel — Two-Way Binding

```typescript
createModel(getValue, setValue, getInput);
```

Preserves cursor position — only updates value when input is not `activeElement`.

### createResource — Async Data Loading

```typescript
const [getState, load] = createResource(() => fetch("/api/data").then(r => r.json()));

// getState() returns:
//   { status: "idle" }
//   | { status: "loading" }
//   | { status: "error", error: string }
//   | { status: "ready", data: T }
```

Discriminated-union state machine for async operations.

### createContext — Dependency Injection

```typescript
const ThemeCtx = createContext({ mode: "dark" });
provideContext(ThemeCtx, { mode: "light" });
const theme = useContext(ThemeCtx);
```

Global context map keyed by symbol.

### createPortal — Teleport

```typescript
registerPortal("modal", document.getElementById("modal-root")!);
createPortal(() => buildModalEl(), () => "modal");
```

Renders content into a different DOM location.

### createDeferred — Debounced Updates

```typescript
const getSearch = signal("");
const getDebounced = createDeferred(getSearch, 300); // 300ms debounce
```

### useRef — DOM Ref

```typescript
const getInput = useRef(() => shadow, "#my-input");
const val = getInput()?.value;
```

---

## 📦 State Layer (`webview/components/state.ts`)

### wasmMemo

```typescript
const getMetrics = wasmMemo(
    (wasm) => wasm.calculateMetrics(getUsers(), getConversion(), getSpend(), getGrowth()),
    null, // fallback when WASM not ready
);
```

Wraps the 3-step pattern (getWasm + try/catch + fallback) into a one-liner.

### scoreItems

```typescript
const getFilteredItems = wasmMemo(
    (wasm) => scoreItems(EXTENSIONS, getSearch().toLowerCase().trim(), wasm),
    [],
);
```

Deduplicates the map/filter/sort pattern shared by extension and grid-item filtering.

### createWasmResource

```typescript
const [getState, load] = createWasmResource((wasm) => wasm.someAsyncOp());
```

Combines `createResource` with WASM readiness check.

### Global Signals

| Signal | Type | Purpose |
|---|---|---|
| `getUsers` / `setUsers` | `number` | Active user count input |
| `getConversion` / `setConversion` | `number` | Conversion rate % |
| `getSpend` / `setSpend` | `number` | Average spend |
| `getGrowth` / `setGrowth` | `number` | Growth rate % |
| `getTab` / `setTab` | `string` | Dashboard/explorer tab |
| `getSearch` / `setSearch` | `string` | Extension search query |
| `getGridSearch` / `setGridSearch` | `string` | Grid menu search |
| `getWasmReady` / `setWasmReady` | `boolean` | WASM init status |
| `getOpenTabs` / `setOpenTabs` | `TabItem[]` | Open editor tabs |
| `getActiveTabName` / `setActiveTabName` | `string` | Active demo tab |

---

## 🏗️ Build Pipeline (`bin/build.js`)

```
bun run build
  → cargo build (wasm32-unknown-unknown)
  → rspack build (extension host)
  → rsbuild build (webview)
  → copy WASM binary + media assets
```

- WASM compiled in release profile (72.6 KB)
- Webview bundle ~92 KB (gzip ~20 KB)
- Extension bundle ~1.6 MB (Vega-Lite, vis-network, Leaflet)
- `wasm-opt` optional (not currently available)

---

## 🧪 Testing

| Layer | Command | Count | Runner |
|---|---|---|---|
| Rust | `bun run test:rust` | 14 | `cargo test` |
| Webview | `bun run test:webview` | 21 | Vitest + Happy DOM |
| All | `bun run test` | 35 | Combined |

### Test Structure

```typescript
// Mock WASM for component tests
beforeEach(() => {
    WasmBridge._setTestingInstance(createMockWasmBridge());
});
afterEach(() => {
    WasmBridge._setTestingInstance(null);
});
```

Components tested in isolation using mock WASM bridge. No real WASM binary needed in webview tests.

---

## 📁 File Map

```
rust/src/
├── util.rs            # 5 macros, WasmResult, memory, logging
├── metrics.rs         # calculate_metrics, generate_chart_data
├── search.rs          # score_search
├── format.rs          # format_text
└── lib.rs             # module declarations

webview/core/
├── exba.ts            # Signals, ExbaComponent, DOMRenderer, all primitives
├── wasm-bridge.ts     # WasmBridge singleton, typed methods, validaton
├── wasm-types.ts      # WasmExports, MetricsResult, ChartPoint, etc.
├── wasm-test-utils.ts # createMockWasmBridge, createMockWasmExports
├── vscode-service.ts  # VS Code message passing
└── utils.ts           # formatCurrency, debounce, etc.

webview/components/
├── state.ts           # Global signals, wasmMemo, scoreItems, createWasmResource
├── dashboard-app.ts   # Main dashboard with WASM analytics
├── wasm-chart.ts      # Reactive SVG chart component
├── grid-menu-app.ts   # Demo grid with createSwitch routing
├── kanban-board.ts    # Keyed list reconciliation via createList
├── calendar-picker.ts # Calendar with month navigation
├── geolocation-demo.ts # Async geolocation with createResource
├── format-demo.ts     # WASM string-return export demo
├── leaflet-demo.ts    # onAfterRender-based Leaflet init
├── vis-network-demo.ts # onAfterRender-based vis-network init
├── tree-view.ts       # Recursive tree with expand/collapse
├── accordion.ts       # Collapsible panels
├── notification-demo.ts # Browser Notification API
├── storage-demo.ts    # localStorage wrapper
├── share-demo.ts      # Web Share API
├── settings-panel.ts  # Settings UI
├── audio-player.ts    # WaveSurfer via ExbaComponent + onAfterRender
└── vega-chart.ts      # Vega-Lite via ExbaComponent

bin/
├── build.js           # Orchestrates Rust + Rspack + Rsbuild
├── link-extension.js  # Symlink to local editors
└── launch.js          # Build + link + launch

src/
├── extension/         # Extension activation, tree provider
├── commands/          # VS Code commands
└── webviews/          # Webview panel controllers
```

---

## 📄 License

MIT
