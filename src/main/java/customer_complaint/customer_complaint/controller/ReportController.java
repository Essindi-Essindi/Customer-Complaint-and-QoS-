package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.dto.request.ReportGenerationRequest;
import customer_complaint.customer_complaint.dto.response.ReportResponse;
import customer_complaint.customer_complaint.exception.ResourceNotFoundException;
import customer_complaint.customer_complaint.model.Report;
import customer_complaint.customer_complaint.security.CustomUserDetails;
import customer_complaint.customer_complaint.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// generate and download pdf reports
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ReportResponse> generate(@AuthenticationPrincipal CustomUserDetails principal,
                                                   @Valid @RequestBody ReportGenerationRequest request) {
        return ResponseEntity.ok(reportService.requestGeneration(principal.getUser().getId(), request));
    }

    // Full history, not just what this browser session happened to generate
    // — newest first (see ReportRepository.findByGeneratedByIdOrderByGeneratedAtDesc).
    @GetMapping
    public ResponseEntity<List<ReportResponse>> list(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(reportService.listForManager(principal.getUser().getId()));
    }

    @GetMapping("/{reportId}/download")
    public ResponseEntity<Resource> download(@PathVariable Long reportId) {
        Report report = reportService.getReportForDownload(reportId);

        Resource resource = new FileSystemResource(report.getFilePath());
        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("Report file is missing on disk");
        }

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=report-" + reportId + ".pdf")
                .body(resource);
    }
}