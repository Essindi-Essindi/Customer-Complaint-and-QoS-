package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.dto.request.ReportGenerationRequest;
import customer_complaint.customer_complaint.dto.response.ReportResponse;
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

    @GetMapping("/{reportId}/download")
    public ResponseEntity<Resource> download(@PathVariable Long reportId) {
        Resource resource = new FileSystemResource("/reports/report-" + reportId + ".pdf");
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=report-" + reportId + ".pdf")
                .body(resource);
    }
}
