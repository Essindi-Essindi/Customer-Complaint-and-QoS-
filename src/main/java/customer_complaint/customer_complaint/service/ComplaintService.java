package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.request.ComplaintStatusUpdateRequest;
import customer_complaint.customer_complaint.dto.request.ComplaintSubmissionRequest;
import customer_complaint.customer_complaint.dto.request.RatingRequest;
import customer_complaint.customer_complaint.dto.response.ComplaintListItemResponse;
import customer_complaint.customer_complaint.dto.response.ComplaintResponse;

import java.util.List;

// core complaint operations
public interface ComplaintService {

    ComplaintResponse submit(Long subscriberId, ComplaintSubmissionRequest request);

    List<ComplaintListItemResponse> listForSubscriber(Long subscriberId);

    List<ComplaintListItemResponse> listForAgent(Long agentId);

    ComplaintResponse track(String ticketNumber);

    ComplaintResponse updateStatus(Long complaintId, ComplaintStatusUpdateRequest request);

    void rate(Long complaintId, RatingRequest request);
}
