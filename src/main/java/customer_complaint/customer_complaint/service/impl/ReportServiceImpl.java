package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.request.ReportGenerationRequest;
import customer_complaint.customer_complaint.dto.response.ReportResponse;
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
import org.springframework.stereotype.Service;

import java.util.List;

// creates the report row, pdf built async
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

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
        report.setType(ReportType.valueOf(request.getType().toUpperCase()));
        report.setStartDate(request.getStartDate());
        report.setEndDate(request.getEndDate());
        reportRepository.save(report);

        reportEventPublisher.publish(new ReportGenerationEvent(
                report.getId(), report.getType().name(), report.getStartDate(), report.getEndDate()));

        return toResponse(report);
    }

    @Override
    public void generatePdf(ReportGenerationEvent event) {
        Report report = reportRepository.findById(event.getReportId())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        List<Complaint> complaints = complaintRepository.findByCreatedAtBetween(
                event.getStartDate().atStartOfDay(), event.getEndDate().plusDays(1).atStartOfDay());

        // PDF rendering itself (iText/JasperReports) happens here, internally
        String filePath = "/reports/report-" + report.getId() + ".pdf";
        report.setFilePath(filePath);
        reportRepository.save(report);
    }

    private ReportResponse toResponse(Report r) {
        return new ReportResponse(r.getId(), r.getType().name(), r.getStartDate(), r.getEndDate(),
                r.getGeneratedAt(), r.getFilePath());
    }
}
