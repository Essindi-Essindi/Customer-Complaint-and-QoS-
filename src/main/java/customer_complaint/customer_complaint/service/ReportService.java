package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.request.ReportGenerationRequest;
import customer_complaint.customer_complaint.dto.response.ReportResponse;
import customer_complaint.customer_complaint.messaging.ReportGenerationEvent;

// pdf report generation
public interface ReportService {

    ReportResponse requestGeneration(Long managerId, ReportGenerationRequest request);

    // Invoked by the queue listener to do the actual PDF rendering
    void generatePdf(ReportGenerationEvent event);
}
