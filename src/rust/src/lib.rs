use std::mem;

extern "C" {
    fn js_log(ptr: *const u8, len: usize);
}

fn log(s: &str) {
    unsafe {
        js_log(s.as_ptr(), s.len());
    }
}

static mut RESULT_BUF: Vec<u8> = Vec::new();

fn set_result(s: &str) {
    unsafe {
        RESULT_BUF = s.as_bytes().to_vec();
    }
}

#[no_mangle]
pub extern "C" fn get_result_ptr() -> *const u8 {
    unsafe { RESULT_BUF.as_ptr() }
}

#[no_mangle]
pub extern "C" fn get_result_len() -> usize {
    unsafe { RESULT_BUF.len() }
}

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}

#[no_mangle]
pub extern "C" fn calculate_metrics(users: u32, conversion_rate: f32, avg_spend: f32, growth_rate: f32) {
    log(&format!("Calculating metrics for {} users...", users));
    // 1. Calculate main metrics
    let active_customers = (users as f32 * (conversion_rate / 100.0)) as u32;
    let monthly_revenue = active_customers as f32 * avg_spend;
    let annual_projection = monthly_revenue * 12.0 * (1.0 + growth_rate / 100.0);
    let churned_customers = (active_customers as f32 * 0.04) as u32; // assuming 4% monthly churn rate
    
    // 2. Format a JSON response
    let json_str = format!(
        r#"{{"activeCustomers": {}, "monthlyRevenue": {:.2}, "annualProjection": {:.2}, "churnedCustomers": {}}}"#,
        active_customers, monthly_revenue, annual_projection, churned_customers
    );
    
    set_result(&json_str);
}

#[no_mangle]
pub extern "C" fn score_search(query_ptr: *const u8, query_len: usize, target_ptr: *const u8, target_len: usize) -> i32 {
    let query = unsafe {
        let slice = std::slice::from_raw_parts(query_ptr, query_len);
        std::str::from_utf8_unchecked(slice)
    }.to_lowercase();

    let target = unsafe {
        let slice = std::slice::from_raw_parts(target_ptr, target_len);
        std::str::from_utf8_unchecked(slice)
    }.to_lowercase();

    log(&format!("Scoring query '{}' against target...", query));

    if query.is_empty() {
        return 100;
    }

    if target.contains(&query) {
        return 100 - (target.len() as i32 - query.len() as i32);
    }

    // Simple fuzzy match: count how many characters of query appear in target in order
    let mut score = 0;
    let mut target_chars = target.chars();
    for q_char in query.chars() {
        if let Some(_) = target_chars.find(|&t_char| t_char == q_char) {
            score += 10;
        } else {
            score -= 5;
        }
    }

    score
}

