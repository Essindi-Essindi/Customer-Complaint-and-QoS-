package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.response.HeatMapResponse;
import customer_complaint.customer_complaint.dto.response.KpiResponse;
import customer_complaint.customer_complaint.dto.response.RecurringPatternResponse;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.repository.ComplaintRepository;
import customer_complaint.customer_complaint.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    public List<HeatMapResponse> getHeatMap(String serviceType, LocalDate start, LocalDate end) {
        List<Complaint> complaints = complaintRepository.findByCreatedAtBetween(
                start.atStartOfDay(), end.plusDays(1).atStartOfDay());

        return complaints.stream()
                .filter(c -> c.getRegion() != null)
                .collect(Collectors.groupingBy(c -> c.getRegion() + "|" + c.getCity(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> {
                    String[] parts = e.getKey().split("\\|");
                    return new HeatMapResponse(parts[0], parts.length > 1 ? parts[1] : "", e.getValue());
                })
                .toList();
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
