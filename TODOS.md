# 📝 Development Roadmap & TODOs

## ✅ Meta-Functionality Abstraction (Complete)

### Rust WASM Engine
- [x] **5 export macros**: `wasm_export!`, `wasm_export_with_args!`, `wasm_export_int!`, `wasm_export_f64!`, `wasm_export_string!`
- [x] **Consistent macro prologue**: `init_panic_hook()` → `clear_result_buffer()` → `log("[WASM] fn_name called")` in all 5 macros
- [x] **WasmResult<T> error handling**: `Result<T, WasmError>` with JSON error serialization
- [x] **3 modules**: `metrics.rs` (JSON return), `search.rs` (int return), `format.rs` (string return)
- [x] **Memory management**: `alloc`/`dealloc`, `get_result_ptr`/`get_result_len`, `clear_result_buffer`, `validate_ptr_range`
- [x] **Panel hook**: `init_panic_hook()` on `Once` — first call sets the hook, subsequent calls no-op
- [x] **Logging**: `js_log` import, debug-only in bridge, always-on for errors/panics
- [x] **Test coverage**: 14 Rust tests (metrics, search, format)

### Typed WASM Bridge
- [x] **WasmBridge singleton**: `init()` → fetch + instantiate + validate + ready
- [x] **Generic dispatch helpers**: `_callJson<T>(fnName, args)`, `_callInt(fnName, args)`, `_callF64(fnName, args)`
- [x] **`_callJson` pipeline**: call export → `_readJsonResult` → JSON parse → `_isErrorResponse` check → typed return
- [x] **String passing**: `_passString(str)` → `[ptr, len]`, `_freeString(ptr, len)` with zeroing + leak-free `try/finally`
- [x] **Export validation**: `WASM_FUNCTIONS` registry + `_validateExports()` on init, warns on missing exports
- [x] **Typed public API**: `calculateMetrics`, `generateChartData`, `scoreSearch`, `formatText`
- [x] **Test injection**: `_setTestingInstance(mock)` → mock via `createMockWasmBridge`
- [x] **Mock factories**: `createMockWasmExports(overrides?)` + `createMockWasmBridge(overrides?)`
- [x] **WASM_FUNCTIONS registry**: single source of truth for expected exports
- [x] **Error state**: WASM init failures tracked in `_status`/`_error`, throw on access before init

### Reactive Framework
- [x] **Core signals**: `signal<T>`, `memo<T>`, `effect`, `batch`, `untrack`
- [x] **Batched updates**: `scheduleEffect` via `queueMicrotask`, single flush per batch
- [x] **ExbaComponent**: abstract base class with shadow DOM, auto-render effect, lifecycle tracking
- [x] **DOMRenderer**: recursive node patching, attribute diffing, activeElement preservation, input value sync
- [x] **Declarative events**: `on-*` attributes → auto-bound event listeners with dedup
- [x] **Boolean attributes**: `?attr` prefix → settable/removable boolean attributes
- [x] **Lifecycle hooks**: `onMount`, `onCleanup`, `onAfterRender`, `onError`
- [x] **`onAfterRender`**: runs synchronously after each DOM patch, replaces `setTimeout(fn,0)`/`requestAnimationFrame`
- [x] **`createList<T>`**: keyed list reconciliation with `data-key`, 3-phase (remove stale → reorder → insert)
- [x] **`createShow`**: conditional rendering with optional `transition.onEnter`/`onLeave`
- [x] **`createSwitch`**: multi-way conditional rendering, replaces nested ternaries
- [x] **`createModel`**: two-way input binding with cursor preservation
- [x] **`createResource<T>`**: async data with discriminated union states (`idle | loading | error | ready`)
- [x] **`createContext<T>`**: DI context with `provideContext`/`useContext`
- [x] **`createPortal`**: teleport content to named DOM roots
- [x] **`createDeferred<T>`**: debounced signal updates
- [x] **`useRef<T>`**: typed DOM element ref helper
- [x] **Error boundaries**: component-scoped `_errorHandler`, caught in `render()`

### State Management
- [x] **`wasmMemo<T, F>`**: reactive WASM getter with fallback, wraps getWasm + try/catch
- [x] **`scoreItems`**: deduplicated map/filter/sort for WASM-scored search filtering
- [x] **`createWasmResource<T>`**: `createResource` integrated with WASM readiness
- [x] **Global signals**: users, conversion, spend, growth, tab, search, gridSearch, wasmReady, openTabs, activeTab

### Component Upgrades
- [x] **Grid-menu-app**: 11-level nested ternary → `createSwitch` + `data-demo-area`
- [x] **Leaflet-demo**: `requestAnimationFrame` → `onAfterRender`
- [x] **Vis-network-demo**: `setTimeout(fn,0)` → `onAfterRender`
- [x] **Dashboard-app Vega chart**: `setTimeout` + inline `demoSpec` → `onAfterRender` + private field
- [x] **Geolocation-demo**: raw signal + manual error → `createResource` with loading/error/ready states
- [x] **Kanban-board**: `.map().join("")` → `createList` with keyed reconciliation per column
- [x] **Audio-player**: plain `HTMLElement` + `innerHTML` → `ExbaComponent` + `onAfterRender` for WaveSurfer
- [x] **Vega-chart**: plain `HTMLElement` + `customElements.define` → `ExbaComponent` + shadow DOM
- [x] **Format-demo**: new component demonstrating `wasm_export_string!` + `WasmBridge.formatText`

### Cleanup
- [x] Removed legacy `ExbaComponent.wasm` static field and `getWasmString()` method
- [x] All `setTimeout`/`requestAnimationFrame` calls removed from components
- [x] Standardized all 4 original Rust macros (`wasm_export!` was missing `clear_result_buffer()`)

### Build & Tooling
- [x] Rust WASM → Rspack extension → Rsbuild webview pipeline
- [x] WASM compiled in release profile (72.6 KB)
- [x] Webview bundle ~92 KB (gzip ~20 KB)
- [x] `bun run launch`: build + symlink + hot-reload VSCodium/Cursor
- [x] Full test suite: 14 Rust + 21 webview = 35 tests

## 🛠️ Short-term

- [ ] **`createList` transition animations**: wire `onEnter`/`onLeave` into kanban-board card add/move/delete
- [ ] **`createShow`/`createSwitch` anim examples**: add CSS transition classes in demo components
- [ ] **WASM resource auto-load**: `createWasmResource` with auto-trigger on mount (auto-load flag)
- [ ] **WASM fallback UI**: components showing graceful degradation when WASM unavailable
- [ ] **`bun run check`**: add to CI — Biome format/lint + typecheck + test

## 🧪 Testing Coverage

- [ ] **WasmBridge unit tests**: `_callInt`, `_callF64`, `formatText`, `_validateExports`
- [ ] **Framework primitive tests**: `createList` reorder/add/remove, `createShow` transitions, `createModel` cursor preservation
- [ ] **Component snapshot tests**: kanban-board CRUD, format-demo output, audio-player mount
- [ ] **Rust `wasm_export_string!` macro test** in WASM context (actual binary, not just `_pure`)

## 🦀 Rust WASM Roadmap

- [ ] **Binary serialization**: Move from JSON to Bincode/MessagePack for reduced overhead
- [ ] **Parallel processing**: WASM threads for batch scoring
- [ ] **Advanced algorithms**: Jaro-Winkler, Levenshtein, TF-IDF scoring
- [ ] **Data sorting/wasm-filter module**: sort complex objects by arbitrary keys
- [ ] **Form validation module**: regex + rule engine in Rust

## 🔌 VS Code Integration

- [ ] **Workspace listeners**: auto-refresh dashboard when workspace files change
- [ ] **WASM lazy-loading**: defer WASM init until first usage, show loading state
- [ ] **Theme-aware components**: deep integration with VS Code CSS variables
- [ ] **Diagnostic provider**: connect Rust engine to provide diagnostics based on WASM analysis

## 📦 DevOps

- [ ] **`wasm-opt` integration**: post-build WASM binary optimization (Binaryen)
- [ ] **CI/CD pipeline**: GitHub Action → compile Rust + bundle JS + package `.vsix`
- [ ] **Bundle size budget**: alert if webview bundle exceeds 100 KB (excl. vendor libs)
- [ ] **Performance benchmarks**: WASM call latency, template render throughput, signal update batching

## 💡 Stretch Ideas

- [ ] **WASM codegen**: script that reads Rust `wasm_export_*!` invocations and auto-generates WasmBridge method stubs + WasmExports type entries
- [ ] **Macro linting**: Rust proc-macro or lint that ensures every `wasm_export_*!` has a matching test
- [ ] **VS Code webview devtools**: custom panel showing reactive signal graph + WASM call log
- [ ] **Hot WASM reload**: detect `.wasm` changes and re-init bridge without page reload
