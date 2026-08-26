package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.model.Complaint;

// resolution service
public interface ResolutionService {

    void resolve(Complaint complaint, Long resolvedByUserId, String note);

    void rate(Long complaintId, int score, String comment);
}