package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.request.ComplaintStatusUpdateRequest;
import customer_complaint.customer_complaint.dto.request.ComplaintSubmissionRequest;
import customer_complaint.customer_complaint.dto.request.RatingRequest;
import customer_complaint.customer_complaint.dto.response.ComplaintListItemResponse;
import customer_complaint.customer_complaint.dto.response.ComplaintManagerListItemResponse;
import customer_complaint.customer_complaint.dto.response.ComplaintResponse;
import customer_complaint.customer_complaint.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

// core complaint operations
public interface ComplaintService {

    ComplaintResponse submit(Long subscriberId, ComplaintSubmissionRequest request);

    List<ComplaintListItemResponse> listForSubscriber(Long subscriberId);

    List<ComplaintListItemResponse> listForAgent(Long agentId);

    // All complaints for a service — shown in agent dashboard "service" tab
    List<ComplaintListItemResponse> listForService(String serviceType);

    // manager-only: every complaint in the system, filtered and paginated
    Page<ComplaintManagerListItemResponse> listForManager(
            String type, String serviceType, String region, String status,
            LocalDate start, LocalDate end, Pageable pageable);

    ComplaintResponse track(String ticketNumber);

    ComplaintResponse updateStatus(User actor, Long complaintId, ComplaintStatusUpdateRequest request);

    ComplaintResponse claim(Long complaintId, Long agentId);

    // Manager assigns (or re-assigns) an agent to a complaint
    ComplaintResponse assignAgent(Long complaintId, Long agentId);

    void rate(Long complaintId, RatingRequest request);
}