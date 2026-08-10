package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.request.ReportGenerationRequest;
import customer_complaint.customer_complaint.dto.response.ReportResponse;
import customer_complaint.customer_complaint.exception.ReportNotReadyException;
import customer_complaint.customer_complaint.exception.ResourceNotFoundException;
import customer_complaint.customer_complaint.messaging.ReportEventPublisher;
import customer_complaint.customer_complaint.messaging.ReportGenerationEvent;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Manager;
import customer_complaint.customer_complaint.model.Report;
import customer_complaint.customer_complaint.model.enums.ReportType;
import customer_complaint.customer_complaint.repository.ComplaintRepository;
import customer_complaint.customer_complaint.repository.ReportRepository;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

// creates the report row, pdf built async
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportServiceImpl.class);

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final ReportEventPublisher reportEventPublisher;

    @Override
    public ReportResponse requestGeneration(Long managerId, ReportGenerationRequest request) {
        Manager manager = (Manager) userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        Report report = new Report();
        report.setGeneratedBy(manager);
        report.setType(parseReportType(request.getType()));
        report.setStartDate(request.getStartDate());
        report.setEndDate(request.getEndDate());
        reportRepository.save(report);

        // FIX: same issue as NotificationServiceImpl.queueSms - the Report row above had already
        // been saved successfully, but if the broker is unreachable the publish throws and the
        // client gets a 500 anyway. The PDF will simply stay pending (filePath null) until the
        // queue is back; downloading it in the meantime already returns a clean 409 via
        // getReportForDownload(), so this degrades gracefully instead of lying about a failure.
        try {
            reportEventPublisher.publish(new ReportGenerationEvent(
                    report.getId(), report.getType().name(), report.getStartDate(), report.getEndDate()));
        } catch (Exception ex) {
            log.warn("Could not queue report generation for report {} - broker may be unreachable",
                    report.getId(), ex);
        }

        return toResponse(report);
    }

    @Override
    public void generatePdf(ReportGenerationEvent event) {
        Report report = reportRepository.findById(event.getReportId())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        List<Complaint> complaints = complaintRepository.findByCreatedAtBetween(
                event.getStartDate().atStartOfDay(), event.getEndDate().plusDays(1).atStartOfDay());

        String filePath = "/reports/report-" + report.getId() + ".pdf";
        report.setFilePath(filePath);
        reportRepository.save(report);
    }

    @Override
    public Report getReportForDownload(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        if (report.getFilePath() == null) {
            throw new ReportNotReadyException(
                    "This report is still being generated. Try downloading it again shortly.");
        }

        return report;
    }

    private ReportType parseReportType(String raw) {
        try {
            return ReportType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid report type '" + raw + "'. Valid values: " + Arrays.toString(ReportType.values()));
        }
    }

    private ReportResponse toResponse(Report r) {
        return new ReportResponse(r.getId(), r.getType().name(), r.getStartDate(), r.getEndDate(),
                r.getGeneratedAt(), r.getFilePath());
    }
}