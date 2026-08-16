package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.response.HeatMapResponse;
import customer_complaint.customer_complaint.dto.response.KpiResponse;
import customer_complaint.customer_complaint.dto.response.RecurringPatternResponse;
import customer_complaint.customer_complaint.dto.response.RegionTotalResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

// heat map, kpis, recurring patterns
public interface AnalyticsService {

    // Paginated region+city breakdown — backs the heatmap page's "by city"
    // table. sortBy is "region", "city", or anything else (including null)
    // for the default: complaintCount descending.
    Page<HeatMapResponse> getHeatMap(
            String serviceType, LocalDate start, LocalDate end, String sortBy, Pageable pageable);

    // Every region's total, unpaginated (at most 10 rows - one per region)
    // — backs the heatmap page's map shading, which needs the true total
    // regardless of which page of the city table is showing.
    List<RegionTotalResponse> getRegionTotals(String serviceType, LocalDate start, LocalDate end);

    List<KpiResponse> getKpis(String groupBy);

    List<RecurringPatternResponse> detectRecurringPatterns();
}
