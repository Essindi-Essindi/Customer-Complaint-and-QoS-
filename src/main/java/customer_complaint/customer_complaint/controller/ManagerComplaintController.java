package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.dto.response.ComplaintManagerListItemResponse;
import customer_complaint.customer_complaint.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

// backs the "Dashboard Overview" table: every complaint in the system,
// filterable and paginated. Path is under /api/manager/** which
// SecurityConfig already restricts to hasRole('MANAGER').
@RestController
@RequestMapping("/api/manager/complaints")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    public ResponseEntity<Page<ComplaintManagerListItemResponse>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(
                complaintService.listForManager(type, serviceType, region, status, start, end, pageable));
    }
}