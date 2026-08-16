package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.request.ReportGenerationRequest;
import customer_complaint.customer_complaint.dto.response.ReportResponse;
import customer_complaint.customer_complaint.messaging.ReportGenerationEvent;
import customer_complaint.customer_complaint.model.Report;

import java.util.List;

// pdf report generation
public interface ReportService {

    ReportResponse requestGeneration(Long managerId, ReportGenerationRequest request);

    void generatePdf(ReportGenerationEvent event);

    Report getReportForDownload(Long reportId);

    // Every report this manager has ever generated, newest first — the
    // report-history table on ManagerReports.tsx used to only ever show
    // what was generated in the current browser session; this is what
    // makes it survive a refresh/new session.
    List<ReportResponse> listForManager(Long managerId);
}