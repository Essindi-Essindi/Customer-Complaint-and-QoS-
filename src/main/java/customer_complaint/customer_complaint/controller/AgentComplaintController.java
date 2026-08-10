package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.dto.request.ComplaintStatusUpdateRequest;
import customer_complaint.customer_complaint.dto.response.ComplaintListItemResponse;
import customer_complaint.customer_complaint.dto.response.ComplaintResponse;
import customer_complaint.customer_complaint.security.CustomUserDetails;
import customer_complaint.customer_complaint.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// agent/manager complaint handling endpoints
@RestController
@RequestMapping("/api/agent/complaints")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('AGENT', 'MANAGER')")
public class AgentComplaintController {

    private final ComplaintService complaintService;

    @GetMapping("/assigned")
    public ResponseEntity<List<ComplaintListItemResponse>> viewAssigned(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(complaintService.listForAgent(principal.getUser().getId()));
    }

    // Restricted to AGENT only (not MANAGER) because the service layer casts the caller to Agent.
    @PreAuthorize("hasRole('AGENT')")
    @PatchMapping("/{complaintId}/claim")
    public ResponseEntity<ComplaintResponse> claim(@PathVariable Long complaintId,
                                                   @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(complaintService.claim(complaintId, principal.getUser().getId()));
    }

    @PatchMapping("/{complaintId}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(@PathVariable Long complaintId,
                                                          @AuthenticationPrincipal CustomUserDetails principal,
                                                          @Valid @RequestBody ComplaintStatusUpdateRequest request) {
        return ResponseEntity.ok(complaintService.updateStatus(principal.getUser(), complaintId, request));
    }
}