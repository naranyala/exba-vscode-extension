use crate::util::validate_ptr_range;
use crate::wasm_export_int;

pub fn score_search_pure(query: &str, target: &str) -> i32 {
    let query = query.to_lowercase();
    let target = target.to_lowercase();

    if query.is_empty() {
        return 0;
    }

    if let Some(idx) = target.find(&query) {
        let length_penalty = (target.len() as i32 - query.len() as i32) / 2;
        let score = 100 - (idx as i32) * 2 - length_penalty;
        return if score < 1 { 1 } else { score };
    }

    let mut score = 80;
    let mut last_idx: Option<usize> = None;

    for q_char in query.chars() {
        let search_start = last_idx.map(|idx| idx + 1).unwrap_or(0);
        if search_start >= target.len() {
            return 0;
        }

        if let Some(found_offset) = target[search_start..].find(q_char) {
            let actual_idx = search_start + found_offset;

            if let Some(prev) = last_idx {
                let gap = actual_idx - prev - 1;
                score -= (gap as i32) * 8;
            } else {
                score -= (actual_idx as i32) * 3;
            }

            last_idx = Some(actual_idx);
        } else {
            return 0;
        }
    }

    if score < 0 { 0 } else { score }
}

wasm_export_int!(
    score_search,
    (query_ptr: *const u8, query_len: usize, target_ptr: *const u8, target_len: usize),
    (|| -> crate::util::WasmResult<i32> {
        validate_ptr_range(query_ptr, query_len)?;
        validate_ptr_range(target_ptr, target_len)?;

        let query = unsafe {
            let s = std::slice::from_raw_parts(query_ptr, query_len);
            std::str::from_utf8(s)?
        };
        let target = unsafe {
            let s = std::slice::from_raw_parts(target_ptr, target_len);
            std::str::from_utf8(s)?
        };

        Ok(score_search_pure(query, target))
    })()
);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_score_search_exact() {
        let score = score_search_pure("rust", "rust");
        assert_eq!(score, 100);
    }

    #[test]
    fn test_score_search_substring() {
        let score = score_search_pure("rust", "Rust Analyzer");
        assert!(score > 0);
        assert!(score < 100);
    }

    #[test]
    fn test_score_search_no_match() {
        let score = score_search_pure("xyz", "abc");
        assert_eq!(score, 0);
    }

    #[test]
    fn test_score_search_empty_query() {
        let score = score_search_pure("", "anything");
        assert_eq!(score, 0);
    }

    #[test]
    fn test_score_search_fuzzy() {
        let score = score_search_pure("rta", "Rust Analyzer");
        assert!(score > 0);
    }
}
