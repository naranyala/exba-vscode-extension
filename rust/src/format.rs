use crate::util::log;
use crate::wasm_export_string;
use serde::Serialize;

#[derive(Serialize)]
pub struct FormattedOutput {
    pub original: String,
    pub uppercase: String,
    pub lowercase: String,
    pub length: usize,
    pub word_count: usize,
}

pub fn format_text_pure(input: &str) -> String {
    let word_count = if input.is_empty() {
        0
    } else {
        input.split_whitespace().count()
    };

    let output = FormattedOutput {
        original: input.to_string(),
        uppercase: input.to_uppercase(),
        lowercase: input.to_lowercase(),
        length: input.len(),
        word_count,
    };

    serde_json::to_string(&output).unwrap_or_else(|_| r#"{"error":"serialization failed"}"#.to_string())
}

wasm_export_string!(
    format_text,
    (input_ptr: *const u8, input_len: usize),
    (|| -> crate::util::WasmResult<String> {
        crate::util::validate_ptr_range(input_ptr, input_len)?;

        let input = unsafe {
            let s = std::slice::from_raw_parts(input_ptr, input_len);
            std::str::from_utf8(s)?
        };

        log(&format!("Formatting text: {} chars", input.len()));
        Ok(format_text_pure(input))
    })()
);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_text_empty() {
        let result = format_text_pure("");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["original"], "");
        assert_eq!(parsed["length"], 0);
        assert_eq!(parsed["word_count"], 0);
    }

    #[test]
    fn test_format_text_normal() {
        let result = format_text_pure("Hello WASM World");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["original"], "Hello WASM World");
        assert_eq!(parsed["uppercase"], "HELLO WASM WORLD");
        assert_eq!(parsed["lowercase"], "hello wasm world");
        assert_eq!(parsed["length"], 16);
        assert_eq!(parsed["word_count"], 3);
    }

    #[test]
    fn test_format_text_unicode() {
        let result = format_text_pure("Rust 🦀 is awesome!");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["word_count"], 4);
        assert!(parsed["length"].as_u64().unwrap() > 10);
    }
}
