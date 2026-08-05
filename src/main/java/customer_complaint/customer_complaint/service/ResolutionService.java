package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.model.Complaint;

// closes out a complaint
public interface ResolutionService {

    void resolve(Complaint complaint, Long resolvedByUserId, String note);
}
