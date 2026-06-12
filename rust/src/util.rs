use std::fmt;
use std::mem;
use std::ptr;
use std::sync::Once;

#[allow(dead_code)]
extern "C" {
    fn js_log(ptr: *const u8, len: usize);
}

pub fn init_panic_hook() {
    static SET_HOOK: Once = Once::new();
    SET_HOOK.call_once(|| {
        std::panic::set_hook(Box::new(|info| {
            let msg = if let Some(s) = info.payload().downcast_ref::<&str>() {
                s.to_string()
            } else if let Some(s) = info.payload().downcast_ref::<String>() {
                s.clone()
            } else if let Some(location) = info.location() {
                format!("at {}:{}", location.file(), location.line())
            } else {
                "unknown panic source".to_string()
            };
            log(&format!("[PANIC] {}", msg));
        }));
    });
}

#[cfg(not(test))]
pub fn log(s: &str) {
    unsafe {
        js_log(s.as_ptr(), s.len());
    }
}

#[cfg(test)]
pub fn log(s: &str) {
    println!("[RUST] {}", s);
}

static mut RESULT_BUF: Vec<u8> = Vec::new();

const MAX_RESULT_SIZE: usize = 1024 * 1024;

pub fn clear_result_buffer() {
    unsafe {
        let buf = ptr::addr_of_mut!(RESULT_BUF);
        (*buf).clear();
    }
}

fn set_result_bytes(bytes: &[u8]) {
    if bytes.len() > MAX_RESULT_SIZE {
        let err = encode_error(&format!(
            "Result too large: {} bytes (max {})",
            bytes.len(),
            MAX_RESULT_SIZE
        ));
        unsafe {
            let buf = ptr::addr_of_mut!(RESULT_BUF);
            *buf = err.into_bytes();
        }
        return;
    }
    unsafe {
        let buf = ptr::addr_of_mut!(RESULT_BUF);
        *buf = bytes.to_vec();
    }
}

#[no_mangle]
pub extern "C" fn get_result_ptr() -> *const u8 {
    unsafe {
        let buf = ptr::addr_of!(RESULT_BUF);
        (*buf).as_ptr()
    }
}

#[no_mangle]
pub extern "C" fn get_result_len() -> usize {
    unsafe {
        let buf = ptr::addr_of!(RESULT_BUF);
        (*buf).len()
    }
}

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    if size == 0 {
        return std::ptr::null_mut();
    }
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}

pub type WasmResult<T> = Result<T, WasmError>;

#[derive(Debug)]
pub struct WasmError {
    pub message: String,
}

impl fmt::Display for WasmError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl WasmError {
    pub fn new(msg: impl Into<String>) -> Self {
        Self {
            message: msg.into(),
        }
    }
}

impl From<String> for WasmError {
    fn from(msg: String) -> Self {
        Self::new(msg)
    }
}

impl From<&str> for WasmError {
    fn from(msg: &str) -> Self {
        Self::new(msg)
    }
}

impl From<serde_json::Error> for WasmError {
    fn from(e: serde_json::Error) -> Self {
        Self::new(format!("JSON error: {}", e))
    }
}

impl From<std::str::Utf8Error> for WasmError {
    fn from(e: std::str::Utf8Error) -> Self {
        Self::new(format!("UTF-8 error: {}", e))
    }
}

pub fn encode_error(msg: &str) -> String {
    serde_json::json!({"error": msg}).to_string()
}

pub fn set_json_result<T: serde::Serialize>(value: &T) {
    match serde_json::to_string(value) {
        Ok(json) => {
            log("[OK] Result serialized successfully");
            set_result_bytes(json.as_bytes());
        }
        Err(e) => {
            let msg = format!("Serialization failed: {}", e);
            log(&format!("[ERROR] {}", &msg));
            let err = encode_error(&msg);
            set_result_bytes(err.as_bytes());
        }
    }
}

pub fn set_error(msg: &str) {
    log(&format!("[ERROR] {}", msg));
    let err = encode_error(msg);
    set_result_bytes(err.as_bytes());
}

pub fn validate_ptr_range(ptr: *const u8, len: usize) -> WasmResult<()> {
    if len == 0 {
        return Ok(());
    }
    if ptr.is_null() {
        return Err(WasmError::new("null pointer with non-zero length"));
    }
    let _end = (ptr as usize)
        .checked_add(len)
        .ok_or_else(|| WasmError::new("pointer arithmetic overflow"))?;
    Ok(())
}

#[macro_export]
macro_rules! wasm_export {
    ($fn_name:ident, $body:expr) => {
        #[no_mangle]
        pub extern "C" fn $fn_name() {
            $crate::util::init_panic_hook();
            $crate::util::clear_result_buffer();
            $crate::util::log(&format!("[WASM] {} called", stringify!($fn_name)));
            let __wasm_result: $crate::util::WasmResult<_> = $body;
            match __wasm_result {
                Ok(val) => $crate::util::set_json_result(&val),
                Err(e) => $crate::util::set_error(&e.message),
            }
        }
    };
}

#[macro_export]
macro_rules! wasm_export_with_args {
    ($fn_name:ident, ( $( $arg_name:ident : $arg_type:ty ),* ), $body:expr) => {
        #[no_mangle]
        pub extern "C" fn $fn_name( $( $arg_name: $arg_type ),* ) {
            $crate::util::init_panic_hook();
            $crate::util::clear_result_buffer();
            $crate::util::log(&format!("[WASM] {} called", stringify!($fn_name)));
            let __wasm_result: $crate::util::WasmResult<_> = $body;
            match __wasm_result {
                Ok(val) => $crate::util::set_json_result(&val),
                Err(e) => $crate::util::set_error(&e.message),
            }
        }
    };
}

#[macro_export]
macro_rules! wasm_export_int {
    ($fn_name:ident, ( $( $arg_name:ident : $arg_type:ty ),* ), $body:expr) => {
        #[no_mangle]
        pub extern "C" fn $fn_name( $( $arg_name: $arg_type ),* ) -> i32 {
            $crate::util::init_panic_hook();
            $crate::util::clear_result_buffer();
            $crate::util::log(&format!("[WASM] {} called", stringify!($fn_name)));
            let __wasm_result: $crate::util::WasmResult<i32> = $body;
            match __wasm_result {
                Ok(val) => val,
                Err(e) => {
                    $crate::util::set_error(&e.message);
                    0
                }
            }
        }
    };
}

#[macro_export]
macro_rules! wasm_export_f64 {
    ($fn_name:ident, ( $( $arg_name:ident : $arg_type:ty ),* ), $body:expr) => {
        #[no_mangle]
        pub extern "C" fn $fn_name( $( $arg_name: $arg_type ),* ) -> f64 {
            $crate::util::init_panic_hook();
            $crate::util::clear_result_buffer();
            $crate::util::log(&format!("[WASM] {} called", stringify!($fn_name)));
            let __wasm_result: $crate::util::WasmResult<f64> = $body;
            match __wasm_result {
                Ok(val) => val,
                Err(e) => {
                    $crate::util::set_error(&e.message);
                    0.0
                }
            }
        }
    };
}

#[macro_export]
macro_rules! wasm_export_string {
    ($fn_name:ident, ( $( $arg_name:ident : $arg_type:ty ),* ), $body:expr) => {
        #[no_mangle]
        pub extern "C" fn $fn_name( $( $arg_name: $arg_type ),* ) -> u32 {
            $crate::util::init_panic_hook();
            $crate::util::clear_result_buffer();
            $crate::util::log(&format!("[WASM] {} called", stringify!($fn_name)));
            let __wasm_result: $crate::util::WasmResult<String> = $body;
            match __wasm_result {
                Ok(val) => $crate::util::set_json_result(&val),
                Err(e) => $crate::util::set_error(&e.message),
            }
            0
        }
    };
}
