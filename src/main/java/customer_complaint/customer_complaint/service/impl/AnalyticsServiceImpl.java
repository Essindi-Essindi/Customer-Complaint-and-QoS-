package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.response.HeatMapResponse;
import customer_complaint.customer_complaint.dto.response.KpiResponse;
import customer_complaint.customer_complaint.dto.response.RecurringPatternResponse;
import customer_complaint.customer_complaint.dto.response.RegionTotalResponse;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.model.enums.ServiceType;
import customer_complaint.customer_complaint.repository.ComplaintRepository;
import customer_complaint.customer_complaint.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// groups complaints for dashboard views
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    // Recurring pattern threshold: same type + region within this window
    private static final int RECURRING_THRESHOLD = 5;
    private static final int RECURRING_WINDOW_DAYS = 7;

    private final ComplaintRepository complaintRepository;

    @Override
    public Page<HeatMapResponse> getHeatMap(
            String serviceType, LocalDate start, LocalDate end, String sortBy, Pageable pageable) {
        List<Complaint> complaints = findInRange(serviceType, start, end);

        // Grouped in memory (not a DB-level Page query) since the source is
        // already a grouped/sorted aggregate rather than raw rows — the
        // dataset here is bounded by distinct (region, city) combinations
        // (a few hundred at most), so this is cheap. PageImpl still gives
        // the frontend real page/total metadata to build pagination
        // controls off, same shape as SpringPage<T> everywhere else in the app.
        List<HeatMapResponse> all = complaints.stream()
                .filter(c -> c.getRegion() != null)
                .collect(Collectors.groupingBy(c -> c.getRegion() + "|" + c.getCity(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> {
                    String[] parts = e.getKey().split("\\|");
                    return new HeatMapResponse(parts[0], parts.length > 1 ? parts[1] : "", e.getValue());
                })
                .sorted(heatMapComparator(sortBy))
                .toList();

        int from = Math.min((int) pageable.getOffset(), all.size());
        int to = Math.min(from + pageable.getPageSize(), all.size());
        return new PageImpl<>(all.subList(from, to), pageable, all.size());
    }

    // "region" / "city" sort alphabetically (region ties broken by city, and
    // vice versa, so the order is still fully deterministic either way);
    // anything else (including null/blank, the default) sorts by complaint
    // count descending — the original behavior, unchanged for callers that
    // don't ask for a specific sort.
    private Comparator<HeatMapResponse> heatMapComparator(String sortBy) {
        return switch (sortBy == null ? "" : sortBy) {
            case "region" -> Comparator.comparing(HeatMapResponse::getRegion)
                    .thenComparing(HeatMapResponse::getCity);
            case "city" -> Comparator.comparing(HeatMapResponse::getCity)
                    .thenComparing(HeatMapResponse::getRegion);
            default -> Comparator.comparingLong(HeatMapResponse::getComplaintCount).reversed();
        };
    }

    @Override
    public List<RegionTotalResponse> getRegionTotals(String serviceType, LocalDate start, LocalDate end) {
        List<Complaint> complaints = findInRange(serviceType, start, end);

        return complaints.stream()
                .filter(c -> c.getRegion() != null)
                .collect(Collectors.groupingBy(Complaint::getRegion, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new RegionTotalResponse(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(RegionTotalResponse::getComplaintCount).reversed())
                .toList();
    }

    // FIX: serviceType used to be accepted as a parameter and silently
    // never applied to the query — findByCreatedAtBetween ignores it
    // entirely, so picking MOBILE/ADSL/FTTH in the heatmap filter had zero
    // effect on either the map or the table; only the date range actually
    // filtered anything. Both getHeatMap and getRegionTotals now route
    // through this shared helper so the fix (and any future one) can't
    // drift between the two.
    private List<Complaint> findInRange(String serviceType, LocalDate start, LocalDate end) {
        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endDt = end.plusDays(1).atStartOfDay();
        if (serviceType == null || serviceType.isBlank()) {
            return complaintRepository.findByCreatedAtBetween(startDt, endDt);
        }
        return complaintRepository.findByServiceTypeAndCreatedAtBetween(parseServiceType(serviceType), startDt, endDt);
    }

    private ServiceType parseServiceType(String raw) {
        try {
            return ServiceType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid serviceType '" + raw + "'. Valid values: " + Arrays.toString(ServiceType.values()));
        }
    }

    @Override
    public List<KpiResponse> getKpis(String groupBy) {
        List<Complaint> complaints = complaintRepository.findAll();

        Map<String, List<Complaint>> grouped = complaints.stream()
                .collect(Collectors.groupingBy(c -> switch (groupBy) {
                    case "region" -> c.getRegion();
                    case "team" -> c.getAgent() != null ? c.getAgent().getAssignedRegion() : "Unassigned";
                    default -> c.getType();
                }));

        return grouped.entrySet().stream()
                .map(e -> toKpi(e.getKey(), e.getValue()))
                .toList();
    }

    @Override
    public List<RecurringPatternResponse> detectRecurringPatterns() {
        LocalDateTime windowStart = LocalDateTime.now().minusDays(RECURRING_WINDOW_DAYS);
        List<Complaint> recent = complaintRepository.findByCreatedAtBetween(windowStart, LocalDateTime.now());

        return recent.stream()
                .collect(Collectors.groupingBy(c -> c.getType() + "|" + c.getRegion(), Collectors.counting()))
                .entrySet().stream()
                .filter(e -> e.getValue() >= RECURRING_THRESHOLD)
                .map(e -> {
                    String[] parts = e.getKey().split("\\|");
                    return new RecurringPatternResponse(parts[0], parts.length > 1 ? parts[1] : "",
                            e.getValue(), "last " + RECURRING_WINDOW_DAYS + " days");
                })
                .toList();
    }

    // Resolution time: (updatedAt - createdAt) in hours for every RESOLVED
    // complaint in the group, averaged. Fully automatic — updatedAt is
    // whatever timestamp ComplaintServiceImpl.updateStatus() last wrote,
    // not a manually-entered figure. Nothing here asks anyone to type a
    // duration.
    private KpiResponse toKpi(String label, List<Complaint> complaints) {
        long resolved = complaints.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED).count();

        double avgHours = complaints.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED && c.getUpdatedAt() != null)
                .mapToLong(c -> Duration.between(c.getCreatedAt(), c.getUpdatedAt()).toHours())
                .average()
                .orElse(0);

        return new KpiResponse(label, avgHours, complaints.size(), resolved);
    }
}
