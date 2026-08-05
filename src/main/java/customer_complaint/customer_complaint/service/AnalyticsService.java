package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.response.HeatMapResponse;
import customer_complaint.customer_complaint.dto.response.KpiResponse;
import customer_complaint.customer_complaint.dto.response.RecurringPatternResponse;

import java.time.LocalDate;
import java.util.List;

// heat map, kpis, recurring patterns
public interface AnalyticsService {

    List<HeatMapResponse> getHeatMap(String serviceType, LocalDate start, LocalDate end);

    List<KpiResponse> getKpis(String groupBy);

    List<RecurringPatternResponse> detectRecurringPatterns();
}
