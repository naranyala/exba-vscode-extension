use std::mem;

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
