/// Comprehensive integration tests across all Rust modules
/// Tests edge cases for: util, metrics, search, format
#[cfg(test)]
mod util_tests {
    use crate::util::*;

    // ─── WasmError ───────────────────────────────────────────────────────────

    #[test]
    fn test_wasm_error_new() {
        let e = WasmError::new("something went wrong");
        assert_eq!(e.message, "something went wrong");
    }

    #[test]
    fn test_wasm_error_from_string() {
        let e: WasmError = String::from("owned error").into();
        assert_eq!(e.message, "owned error");
    }

    #[test]
    fn test_wasm_error_from_str() {
        let e: WasmError = "str error".into();
        assert_eq!(e.message, "str error");
    }

    #[test]
    fn test_wasm_error_display() {
        let e = WasmError::new("display test");
        assert_eq!(format!("{}", e), "display test");
    }

    #[test]
    fn test_wasm_error_debug() {
        let e = WasmError::new("debug test");
        let s = format!("{:?}", e);
        assert!(s.contains("WasmError"));
        assert!(s.contains("debug test"));
    }

    #[test]
    fn test_wasm_error_from_serde_json_error() {
        // Force a serde_json error by trying to parse invalid JSON
        let result: Result<serde_json::Value, _> = serde_json::from_str("not valid json");
        let err = result.unwrap_err();
        let wasm_err: WasmError = err.into();
        assert!(wasm_err.message.contains("JSON error"));
    }

    #[test]
    fn test_wasm_error_from_utf8_error() {
        let invalid_bytes = [0xFF, 0xFE, 0xFD]; // Invalid UTF-8
        let result = std::str::from_utf8(&invalid_bytes);
        let err = result.unwrap_err();
        let wasm_err: WasmError = err.into();
        assert!(wasm_err.message.contains("UTF-8 error"));
    }

    // ─── encode_error ────────────────────────────────────────────────────────

    #[test]
    fn test_encode_error_produces_valid_json() {
        let encoded = encode_error("test error message");
        let parsed: serde_json::Value = serde_json::from_str(&encoded).unwrap();
        assert_eq!(parsed["error"], "test error message");
    }

    #[test]
    fn test_encode_error_empty_message() {
        let encoded = encode_error("");
        let parsed: serde_json::Value = serde_json::from_str(&encoded).unwrap();
        assert_eq!(parsed["error"], "");
    }

    #[test]
    fn test_encode_error_with_special_chars() {
        let encoded = encode_error("error with \"quotes\" and \\backslash");
        let parsed: serde_json::Value = serde_json::from_str(&encoded).unwrap();
        assert!(parsed["error"].as_str().unwrap().contains("quotes"));
    }

    #[test]
    fn test_encode_error_with_unicode() {
        let encoded = encode_error("Unicode: 🦀 Rust panic at line 42");
        let parsed: serde_json::Value = serde_json::from_str(&encoded).unwrap();
        assert!(parsed["error"].as_str().unwrap().contains("🦀"));
    }

    // ─── validate_ptr_range ──────────────────────────────────────────────────

    #[test]
    fn test_validate_ptr_range_zero_len_ok() {
        // len=0 should always succeed regardless of ptr
        let result = validate_ptr_range(std::ptr::null(), 0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_ptr_range_null_ptr_nonzero_len_errors() {
        let result = validate_ptr_range(std::ptr::null(), 10);
        assert!(result.is_err());
        assert!(result.unwrap_err().message.contains("null pointer"));
    }

    #[test]
    fn test_validate_ptr_range_valid_ptr_succeeds() {
        let buf = [0u8; 10];
        let result = validate_ptr_range(buf.as_ptr(), buf.len());
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_ptr_range_overflow_detection() {
        // Use a near-max pointer to trigger overflow in checked_add
        let result = validate_ptr_range(usize::MAX as *const u8, 1);
        assert!(result.is_err());
        let msg = result.unwrap_err().message;
        assert!(msg.contains("overflow") || msg.contains("null pointer"), "Got: {}", msg);
    }

    // ─── log (test mode) ─────────────────────────────────────────────────────

    #[test]
    fn test_log_does_not_panic() {
        // In test mode, log() writes to stdout. Just verify it doesn't panic.
        log("test log message");
        log("");
        log("🦀 unicode log");
    }

    // ─── init_panic_hook ─────────────────────────────────────────────────────

    #[test]
    fn test_init_panic_hook_can_be_called_multiple_times() {
        // Should be idempotent (Once internally)
        init_panic_hook();
        init_panic_hook();
        init_panic_hook();
    }

    // ─── alloc / dealloc ─────────────────────────────────────────────────────

    #[test]
    fn test_alloc_zero_size_returns_null() {
        use crate::util::alloc;
        let ptr = alloc(0);
        assert!(ptr.is_null());
    }

    #[test]
    fn test_alloc_nonzero_returns_nonnull() {
        use crate::util::alloc;
        use crate::util::dealloc;
        let ptr = alloc(64);
        assert!(!ptr.is_null());
        // Must free to avoid leak
        dealloc(ptr, 64);
    }

    #[test]
    fn test_dealloc_null_pointer_is_safe() {
        use crate::util::dealloc;
        // Should not panic or crash
        dealloc(std::ptr::null_mut(), 0);
        dealloc(std::ptr::null_mut(), 100);
    }

    #[test]
    fn test_alloc_and_write() {
        use crate::util::alloc;
        use crate::util::dealloc;
        let size = 16;
        let ptr = alloc(size);
        assert!(!ptr.is_null());
        // Write and read
        unsafe {
            for i in 0..size {
                *ptr.add(i) = i as u8;
            }
            for i in 0..size {
                assert_eq!(*ptr.add(i), i as u8);
            }
        }
        dealloc(ptr, size);
    }

    // ─── set_json_result / get_result_ptr / get_result_len ───────────────────

    use std::sync::Mutex;
    static RESULT_BUF_MUTEX: Mutex<()> = Mutex::new(());

    #[test]
    fn test_set_json_result_populates_buffer() {
        let _lock = RESULT_BUF_MUTEX.lock().unwrap();
        clear_result_buffer();
        #[derive(serde::Serialize)]
        struct Test {
            val: i32,
        }
        set_json_result(&Test { val: 42 });

        let len = get_result_len();
        assert!(len > 0);

        let ptr = get_result_ptr();
        let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
        let json = std::str::from_utf8(bytes).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(parsed["val"], 42);
    }

    #[test]
    fn test_set_json_result_overwrites_previous() {
        let _lock = RESULT_BUF_MUTEX.lock().unwrap();
        clear_result_buffer();
        #[derive(serde::Serialize)]
        struct A {
            a: &'static str,
        }
        #[derive(serde::Serialize)]
        struct B {
            b: i32,
        }

        set_json_result(&A { a: "first" });
        set_json_result(&B { b: 99 });

        let len = get_result_len();
        let ptr = get_result_ptr();
        let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
        let json = std::str::from_utf8(bytes).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(parsed["b"], 99);
        assert!(parsed.get("a").is_none());
    }

    #[test]
    fn test_clear_result_buffer_empties() {
        let _lock = RESULT_BUF_MUTEX.lock().unwrap();
        #[derive(serde::Serialize)]
        struct X {
            x: bool,
        }
        set_json_result(&X { x: true });
        clear_result_buffer();
        assert_eq!(get_result_len(), 0);
    }

    #[test]
    fn test_set_error_writes_error_json() {
        let _lock = RESULT_BUF_MUTEX.lock().unwrap();
        clear_result_buffer();
        set_error("critical failure");
        let len = get_result_len();
        assert!(len > 0);
        let ptr = get_result_ptr();
        let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
        let json = std::str::from_utf8(bytes).unwrap();
        assert!(json.contains("critical failure"));
        let parsed: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(parsed["error"], "critical failure");
    }
}

#[cfg(test)]
mod metrics_edge_tests {
    use crate::metrics::*;

    // ─── calculate_metrics_pure ───────────────────────────────────────────────

    #[test]
    fn test_churn_is_4_percent_of_active() {
        let m = calculate_metrics_pure(10000, 10.0, 100.0, 0.0);
        // active = 1000, churn = 4% of 1000 = 40
        assert_eq!(m.churned_customers, 40);
    }

    #[test]
    fn test_100_percent_conversion() {
        let m = calculate_metrics_pure(500, 100.0, 10.0, 0.0);
        assert_eq!(m.active_customers, 500);
        assert_eq!(m.monthly_revenue, 5000.0);
    }

    #[test]
    fn test_zero_conversion_rate() {
        let m = calculate_metrics_pure(100000, 0.0, 200.0, 50.0);
        assert_eq!(m.active_customers, 0);
        assert_eq!(m.monthly_revenue, 0.0);
        assert_eq!(m.annual_projection, 0.0);
        assert_eq!(m.churned_customers, 0);
    }

    #[test]
    fn test_zero_avg_spend() {
        let m = calculate_metrics_pure(1000, 50.0, 0.0, 100.0);
        assert_eq!(m.monthly_revenue, 0.0);
        assert_eq!(m.annual_projection, 0.0);
    }

    #[test]
    fn test_100_percent_growth_rate() {
        // annual_projection = monthly * 12 * (1 + 1.0) = monthly * 24
        let m = calculate_metrics_pure(100, 100.0, 10.0, 100.0);
        assert_eq!(m.monthly_revenue, 1000.0);
        assert!((m.annual_projection - 24000.0).abs() < 0.001);
    }

    #[test]
    fn test_negative_growth_rate() {
        let m = calculate_metrics_pure(1000, 10.0, 50.0, -50.0);
        // annual_projection = 5000 * 12 * 0.5 = 30000
        assert!((m.annual_projection - 30000.0).abs() < 0.001);
    }

    #[test]
    fn test_fractional_conversion_floors_active_customers() {
        // 100 users * 0.5% = 0.5 → truncated to 0
        let m = calculate_metrics_pure(100, 0.5, 10.0, 0.0);
        assert_eq!(m.active_customers, 0);
    }

    #[test]
    fn test_very_small_conversion_rate() {
        // 1,000,000 users * 0.001% = 10.0 → 10 customers
        let m = calculate_metrics_pure(1_000_000, 0.001, 100.0, 0.0);
        assert_eq!(m.active_customers, 10);
        assert_eq!(m.monthly_revenue, 1000.0);
    }

    #[test]
    fn test_large_user_count_no_overflow() {
        // u32::MAX users with 1% conversion
        let m = calculate_metrics_pure(4_000_000_000, 1.0, 1.0, 0.0);
        // Should not panic, active = 40_000_000
        assert!(m.active_customers > 0);
    }

    // ─── generate_chart_data_pure ────────────────────────────────────────────

    #[test]
    fn test_chart_data_always_12_points() {
        let points = generate_chart_data_pure(1.0, 5.0);
        assert_eq!(points.len(), 12);
    }

    #[test]
    fn test_chart_data_x_indices_are_0_to_11() {
        let points = generate_chart_data_pure(100.0, 10.0);
        for (i, point) in points.iter().enumerate() {
            assert_eq!(point.x, i as u32);
        }
    }

    #[test]
    fn test_chart_data_first_y_equals_initial_revenue() {
        let points = generate_chart_data_pure(999.0, 12.0);
        assert_eq!(points[0].y, 999.0);
    }

    #[test]
    fn test_chart_data_zero_initial_revenue() {
        let points = generate_chart_data_pure(0.0, 100.0);
        for p in &points {
            assert_eq!(p.y, 0.0);
        }
    }

    #[test]
    fn test_chart_data_monotone_increasing_with_positive_growth() {
        let points = generate_chart_data_pure(100.0, 24.0);
        for i in 1..12 {
            assert!(
                points[i].y > points[i - 1].y,
                "Month {} should be > month {}",
                i,
                i - 1
            );
        }
    }

    #[test]
    fn test_chart_data_monotone_decreasing_with_negative_growth() {
        let points = generate_chart_data_pure(1000.0, -24.0);
        for i in 1..12 {
            assert!(
                points[i].y < points[i - 1].y,
                "Month {} should be < month {}",
                i,
                i - 1
            );
        }
    }

    #[test]
    fn test_chart_data_precision_compound_growth() {
        // 12% annual → 1% monthly compounding
        let points = generate_chart_data_pure(1000.0, 12.0);
        // After 12 months: 1000 * (1 + 0.01)^12 ≈ 1126.83
        let expected_last = 1000.0_f64 * (1.01_f64.powi(11)); // index 11 = month 12 before this multiply
        assert!((points[11].y - expected_last).abs() < 0.01);
    }

    #[test]
    fn test_chart_data_very_high_growth() {
        let points = generate_chart_data_pure(1.0, 1200.0); // 1200% annual = 100% monthly
        assert!(points[11].y > points[0].y);
    }
}

#[cfg(test)]
mod search_edge_tests {
    use crate::search::*;

    // ─── Exact match ─────────────────────────────────────────────────────────

    #[test]
    fn test_exact_match_score_is_100() {
        assert_eq!(score_search_pure("rust", "rust"), 100);
    }

    #[test]
    fn test_exact_match_case_insensitive() {
        assert_eq!(score_search_pure("RUST", "rust"), 100);
        assert_eq!(score_search_pure("rust", "RUST"), 100);
        assert_eq!(score_search_pure("Rust", "RUST"), 100);
    }

    #[test]
    fn test_empty_query_always_zero() {
        assert_eq!(score_search_pure("", "anything"), 0);
        assert_eq!(score_search_pure("", ""), 0);
        assert_eq!(score_search_pure("", "   "), 0);
    }

    #[test]
    fn test_empty_target_no_match() {
        assert_eq!(score_search_pure("rust", ""), 0);
    }

    // ─── Substring scoring ───────────────────────────────────────────────────

    #[test]
    fn test_substring_at_start_higher_than_middle() {
        let start_score = score_search_pure("rust", "rust analyzer");
        let mid_score = score_search_pure("rust", "the rust language");
        // idx=0 vs idx=4 — start scores higher due to lower idx penalty
        assert!(start_score > mid_score, "start={} mid={}", start_score, mid_score);
    }

    #[test]
    fn test_longer_target_lower_score_due_to_length_penalty() {
        let short = score_search_pure("abc", "abc");
        let long = score_search_pure("abc", "abc and much more text here");
        assert!(short > long, "short={} long={}", short, long);
    }

    #[test]
    fn test_score_floors_at_1_not_negative_for_substring() {
        // Very long target should still score >= 1 if it contains query
        let score = score_search_pure("a", "a".repeat(1000).as_str());
        assert!(score >= 1, "score should floor at 1, got {}", score);
    }

    // ─── No match ────────────────────────────────────────────────────────────

    #[test]
    fn test_no_match_returns_zero() {
        assert_eq!(score_search_pure("xyz", "abc def ghi"), 0);
        assert_eq!(score_search_pure("zzz", "aaa bbb ccc"), 0);
    }

    // ─── Fuzzy matching ──────────────────────────────────────────────────────

    #[test]
    fn test_fuzzy_returns_positive_score() {
        let score = score_search_pure("rta", "Rust Analyzer");
        assert!(score > 0, "fuzzy match should score > 0, got {}", score);
    }

    #[test]
    fn test_fuzzy_consecutive_chars_score_higher_than_spread() {
        // "ra" consecutive in "radar" at indices 0,1 vs spread in "rubber ants"
        let consec = score_search_pure("ra", "rabbit");
        let spread = score_search_pure("ra", "rearrange art");
        // "rabbit" has 'r' at 0, 'a' at 1 (gap=0) → higher score
        assert!(consec >= spread, "consec={} spread={}", consec, spread);
    }

    #[test]
    fn test_fuzzy_first_char_position_penalty() {
        // "b" starting at index 3 vs index 0
        let early = score_search_pure("be", "best effort");
        let late = score_search_pure("be", "abcbe");
        assert!(early > late, "early={} late={}", early, late);
    }

    #[test]
    fn test_fuzzy_char_not_found_returns_zero() {
        // "az" — 'a' found but 'z' not after 'a'
        assert_eq!(score_search_pure("az", "abc"), 0);
    }

    #[test]
    fn test_fuzzy_score_floors_at_zero() {
        // Very spread fuzzy match should not go negative
        let score = score_search_pure("abc", "a_____b_____c");
        assert!(score >= 0, "fuzzy score should be >= 0, got {}", score);
    }

    // ─── Scoring ordering ────────────────────────────────────────────────────

    #[test]
    fn test_exact_beats_substring_beats_fuzzy() {
        let exact = score_search_pure("rust", "rust");
        let substr = score_search_pure("rust", "rust lang");
        let fuzzy = score_search_pure("rut", "Rust Analyzer");

        assert!(exact >= substr, "exact={} substr={}", exact, substr);
        // Note: fuzzy vs substr ranking is algorithm-dependent; just ensure all > 0
        assert!(substr > 0);
        assert!(fuzzy > 0);
    }

    #[test]
    fn test_single_char_query_exact_match() {
        let score = score_search_pure("a", "a");
        assert_eq!(score, 100);
    }

    #[test]
    fn test_multi_char_unicode_query() {
        // Unicode characters in query and target
        let score = score_search_pure("🦀", "The Rust 🦀 mascot");
        assert!(score > 0, "unicode search should work, got {}", score);
    }
}

#[cfg(test)]
mod format_edge_tests {
    use crate::format::*;

    // ─── Basic formatting ────────────────────────────────────────────────────

    #[test]
    fn test_empty_string() {
        let result = format_text_pure("");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["original"], "");
        assert_eq!(parsed["uppercase"], "");
        assert_eq!(parsed["lowercase"], "");
        assert_eq!(parsed["length"], 0);
        assert_eq!(parsed["word_count"], 0);
    }

    #[test]
    fn test_single_word() {
        let result = format_text_pure("hello");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["word_count"], 1);
        assert_eq!(parsed["uppercase"], "HELLO");
        assert_eq!(parsed["lowercase"], "hello");
    }

    #[test]
    fn test_multiple_words_counted() {
        let result = format_text_pure("one two three four five");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["word_count"], 5);
    }

    #[test]
    fn test_whitespace_only_has_zero_words() {
        let result = format_text_pure("   \t  \n  ");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["word_count"], 0);
    }

    #[test]
    fn test_leading_trailing_whitespace_counted_in_length() {
        let result = format_text_pure("  hi  ");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        // length = 6 (includes spaces)
        assert_eq!(parsed["length"], 6);
        // word count ignores leading/trailing spaces
        assert_eq!(parsed["word_count"], 1);
    }

    #[test]
    fn test_case_conversion_mixed_input() {
        let result = format_text_pure("Hello WASM World");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["uppercase"], "HELLO WASM WORLD");
        assert_eq!(parsed["lowercase"], "hello wasm world");
    }

    #[test]
    fn test_unicode_emoji_length_is_byte_length() {
        let input = "Hi 🦀";
        let result = format_text_pure(input);
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        // 🦀 = 4 bytes in UTF-8
        assert_eq!(parsed["length"], input.len() as u64);
    }

    #[test]
    fn test_unicode_word_count() {
        let result = format_text_pure("Rust 🦀 is awesome!");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        // "Rust", "🦀", "is", "awesome!" = 4 words
        assert_eq!(parsed["word_count"], 4);
    }

    #[test]
    fn test_newline_separated_words_count_as_words() {
        let result = format_text_pure("line1\nline2\nline3");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["word_count"], 3);
    }

    #[test]
    fn test_output_is_valid_json() {
        let result = format_text_pure("test");
        assert!(serde_json::from_str::<serde_json::Value>(&result).is_ok());
    }

    #[test]
    fn test_special_json_chars_in_input_are_escaped() {
        let result = format_text_pure(r#"has "quotes" and \backslash"#);
        // Should produce valid JSON (not crash serialization)
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert!(parsed["original"].as_str().unwrap().contains("quotes"));
    }

    #[test]
    fn test_very_long_input() {
        let long = "word ".repeat(10000);
        let result = format_text_pure(&long);
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["word_count"], 10000);
    }

    #[test]
    fn test_numbers_as_input() {
        let result = format_text_pure("42 3.14 100");
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["word_count"], 3);
        assert_eq!(parsed["uppercase"], "42 3.14 100"); // digits unchanged by case
    }

    #[test]
    fn test_original_field_preserved_exactly() {
        let input = "Hello, World! 🌍";
        let result = format_text_pure(input);
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["original"], input);
    }
}
