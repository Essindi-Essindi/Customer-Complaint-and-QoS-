package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.request.ReportGenerationRequest;
import customer_complaint.customer_complaint.dto.response.ReportResponse;
import customer_complaint.customer_complaint.messaging.ReportGenerationEvent;
import customer_complaint.customer_complaint.model.Report;

// pdf report generation
public interface ReportService {

    ReportResponse requestGeneration(Long managerId, ReportGenerationRequest request);

    void generatePdf(ReportGenerationEvent event);

    Report getReportForDownload(Long reportId);
}