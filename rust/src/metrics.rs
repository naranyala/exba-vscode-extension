use crate::util::log;
use crate::wasm_export_with_args;
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Metrics {
    pub active_customers: u32,
    pub monthly_revenue: f64,
    pub annual_projection: f64,
    pub churned_customers: u32,
}

pub fn calculate_metrics_pure(
    users: u32,
    conversion_rate: f64,
    avg_spend: f64,
    growth_rate: f64,
) -> Metrics {
    let active_customers = (users as f64 * (conversion_rate / 100.0)) as u32;
    let monthly_revenue = active_customers as f64 * avg_spend;
    let annual_projection = monthly_revenue * 12.0 * (1.0 + growth_rate / 100.0);
    let churned_customers = (active_customers as f64 * 0.04) as u32;

    Metrics {
        active_customers,
        monthly_revenue,
        annual_projection,
        churned_customers,
    }
}

wasm_export_with_args!(
    calculate_metrics,
    (users: u32, conversion_rate: f64, avg_spend: f64, growth_rate: f64),
    {
        log(&format!("Calculating metrics for {} users...", users));
        Ok(calculate_metrics_pure(users, conversion_rate, avg_spend, growth_rate))
    }
);

#[derive(Serialize)]
pub struct ChartPoint {
    pub x: u32,
    pub y: f64,
}

pub fn generate_chart_data_pure(initial_revenue: f64, growth_rate: f64) -> Vec<ChartPoint> {
    let mut points = Vec::new();
    let mut current_revenue = initial_revenue;
    let monthly_growth = growth_rate / 100.0 / 12.0;

    for month in 0..12 {
        points.push(ChartPoint {
            x: month as u32,
            y: current_revenue,
        });
        current_revenue *= 1.0 + monthly_growth;
    }
    points
}

wasm_export_with_args!(
    generate_chart_data,
    (initial_revenue: f64, growth_rate: f64),
    {
        log("Generating 12-month growth chart data...");
        Ok(generate_chart_data_pure(initial_revenue, growth_rate))
    }
);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_metrics_nominal() {
        let metrics = calculate_metrics_pure(1000, 10.0, 50.0, 0.0);
        assert_eq!(metrics.active_customers, 100);
        assert_eq!(metrics.monthly_revenue, 5000.0);
        assert_eq!(metrics.annual_projection, 60000.0);
    }

    #[test]
    fn test_calculate_metrics_zero_users() {
        let metrics = calculate_metrics_pure(0, 10.0, 50.0, 0.0);
        assert_eq!(metrics.active_customers, 0);
        assert_eq!(metrics.monthly_revenue, 0.0);
    }

    #[test]
    fn test_calculate_metrics_large_values() {
        let metrics = calculate_metrics_pure(10_000_000, 50.0, 200.0, 25.0);
        assert_eq!(metrics.active_customers, 5_000_000);
        assert!(metrics.monthly_revenue > 0.0);
        assert!(metrics.annual_projection > metrics.monthly_revenue);
    }

    #[test]
    fn test_generate_chart_data() {
        let points = generate_chart_data_pure(100.0, 12.0);
        assert_eq!(points.len(), 12);
        assert_eq!(points[0].y, 100.0);
        assert!(points[11].y > 110.0);
    }

    #[test]
    fn test_generate_chart_data_negative_growth() {
        let points = generate_chart_data_pure(100.0, -12.0);
        assert_eq!(points.len(), 12);
        assert!(points[11].y < 100.0);
    }

    #[test]
    fn test_generate_chart_data_zero_growth() {
        let points = generate_chart_data_pure(100.0, 0.0);
        for point in &points {
            assert_eq!(point.y, 100.0);
        }
    }
}
