package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.dto.response.HeatMapResponse;
import customer_complaint.customer_complaint.dto.response.KpiResponse;
import customer_complaint.customer_complaint.dto.response.RecurringPatternResponse;
import customer_complaint.customer_complaint.dto.response.RegionTotalResponse;
import customer_complaint.customer_complaint.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// endpoint setup
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // build response
    @GetMapping("/heatmap")
    public ResponseEntity<Page<HeatMapResponse>> heatMap(
            @RequestParam(required = false) String serviceType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(analyticsService.getHeatMap(serviceType, start, end, sortBy, pageable));
    }

    // return totals
    @GetMapping("/heatmap/regions")
    public ResponseEntity<List<RegionTotalResponse>> regionTotals(
            @RequestParam(required = false) String serviceType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(analyticsService.getRegionTotals(serviceType, start, end));
    }

    @GetMapping("/kpis")
    public ResponseEntity<List<KpiResponse>> kpis(@RequestParam(defaultValue = "type") String groupBy) {
        return ResponseEntity.ok(analyticsService.getKpis(groupBy));
    }

    @GetMapping("/recurring-patterns")
    public ResponseEntity<List<RecurringPatternResponse>> recurringPatterns() {
        return ResponseEntity.ok(analyticsService.detectRecurringPatterns());
    }
}
