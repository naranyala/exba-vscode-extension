use std::mem;

extern "C" {
    fn js_log(ptr: *const u8, len: usize);
}

#[cfg(not(test))]
fn log(s: &str) {
    unsafe {
        js_log(s.as_ptr(), s.len());
    }
}

#[cfg(test)]
fn log(s: &str) {
    println!("[MOCK LOG] {}", s);
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

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Metrics {
    pub active_customers: u32,
    pub monthly_revenue: f32,
    pub annual_projection: f32,
    pub churned_customers: u32,
}

pub fn calculate_metrics_pure(users: u32, conversion_rate: f32, avg_spend: f32, growth_rate: f32) -> Metrics {
    let active_customers = (users as f32 * (conversion_rate / 100.0)) as u32;
    let monthly_revenue = active_customers as f32 * avg_spend;
    let annual_projection = monthly_revenue * 12.0 * (1.0 + growth_rate / 100.0);
    let churned_customers = (active_customers as f32 * 0.04) as u32; 

    Metrics {
        active_customers,
        monthly_revenue,
        annual_projection,
        churned_customers,
    }
}

#[no_mangle]
pub extern "C" fn calculate_metrics(users: u32, conversion_rate: f32, avg_spend: f32, growth_rate: f32) {
    log(&format!("Calculating metrics for {} users...", users));
    
    let metrics = calculate_metrics_pure(users, conversion_rate, avg_spend, growth_rate);
    let json_str = serde_json::to_string(&metrics).unwrap();
    
    set_result(&json_str);
}

#[derive(serde::Serialize)]
pub struct ChartPoint {
    pub x: u32,
    pub y: f32,
}

pub fn generate_chart_data_pure(initial_revenue: f32, growth_rate: f32) -> Vec<ChartPoint> {
    let mut points = Vec::new();
    let mut current_revenue = initial_revenue;
    let monthly_growth = growth_rate / 100.0 / 12.0;

    for month in 0..12 {
        points.push(ChartPoint { x: month as u32, y: current_revenue });
        current_revenue *= 1.0 + monthly_growth;
    }
    points
}

#[no_mangle]
pub extern "C" fn generate_chart_data(initial_revenue: f32, growth_rate: f32) {
    log("Generating 12-month growth chart data...");
    
    let points = generate_chart_data_pure(initial_revenue, growth_rate);
    let json_str = serde_json::to_string(&points).unwrap();
    
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_metrics() {
        let metrics = calculate_metrics_pure(1000, 10.0, 50.0, 0.0);
        assert_eq!(metrics.active_customers, 100);
        assert_eq!(metrics.monthly_revenue, 5000.0);
        assert_eq!(metrics.annual_projection, 60000.0);
    }

    #[test]
    fn test_score_search() {
        let score = score_search("rust".as_ptr(), 4, "Rust Analyzer".as_ptr(), 13);
        assert!(score > 0);
        
        let exact = score_search("rust".as_ptr(), 4, "rust".as_ptr(), 4);
        assert_eq!(exact, 100);

        let no_match = score_search("xyz".as_ptr(), 3, "abc".as_ptr(), 3);
        assert!(no_match < 0);
    }

    #[test]
    fn test_generate_chart_data() {
        let points = generate_chart_data_pure(100.0, 12.0); // 1% monthly growth
        assert_eq!(points.len(), 12);
        assert_eq!(points[0].y, 100.0);
        assert!(points[11].y > 110.0);
    }
}

