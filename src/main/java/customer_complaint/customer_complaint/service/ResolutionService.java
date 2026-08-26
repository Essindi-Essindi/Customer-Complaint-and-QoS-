package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.model.Complaint;

// handle service logic
public interface ResolutionService {

    void resolve(Complaint complaint, Long resolvedByUserId, String note);

    void rate(Long complaintId, int score, String comment);
}