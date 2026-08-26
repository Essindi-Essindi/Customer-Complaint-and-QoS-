package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.response.HeatMapResponse;
import customer_complaint.customer_complaint.dto.response.KpiResponse;
import customer_complaint.customer_complaint.dto.response.RecurringPatternResponse;
import customer_complaint.customer_complaint.dto.response.RegionTotalResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

// analytics service
public interface AnalyticsService {

    // fetch data
    Page<HeatMapResponse> getHeatMap(
            String serviceType, LocalDate start, LocalDate end, String sortBy, Pageable pageable);

    // fetch data
    List<RegionTotalResponse> getRegionTotals(String serviceType, LocalDate start, LocalDate end);

    List<KpiResponse> getKpis(String groupBy);

    List<RecurringPatternResponse> detectRecurringPatterns();
}
