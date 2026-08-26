package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.dto.request.AssignAgentRequest;
import customer_complaint.customer_complaint.dto.response.AgentWithLoadResponse;
import customer_complaint.customer_complaint.dto.response.ComplaintManagerListItemResponse;
import customer_complaint.customer_complaint.dto.response.ComplaintResponse;
import customer_complaint.customer_complaint.model.Agent;
import customer_complaint.customer_complaint.repository.ComplaintRepository;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// endpoint setup
@RestController
@RequestMapping("/api/manager/complaints")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerComplaintController {

    private final ComplaintService complaintService;
    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;

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

    // handle request
    @PostMapping("/{complaintId}/assign")
    public ResponseEntity<ComplaintResponse> assign(@PathVariable Long complaintId,
                                                    @Valid @RequestBody AssignAgentRequest request) {
        return ResponseEntity.ok(complaintService.assignAgent(complaintId, request.getAgentId()));
    }

    // build response
    @GetMapping("/agents-by-service")
    public ResponseEntity<List<AgentWithLoadResponse>> agentsByService(@RequestParam String service) {
        List<Agent> agents = userRepository.findActiveAgentsByService(service);
        List<AgentWithLoadResponse> result = agents.stream()
                .map(a -> new AgentWithLoadResponse(
                        a.getId(),
                        a.getName(),
                        a.getEmail(),
                        a.getAssignedService(),
                        a.getAssignedRegion(),
                        complaintRepository.countActiveByAgentId(a.getId())))
                .toList();
        return ResponseEntity.ok(result);
    }
}