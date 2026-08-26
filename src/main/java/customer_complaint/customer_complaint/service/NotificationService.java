package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.model.Complaint;

// notification service
public interface NotificationService {

    void notifyTicketCreated(Complaint complaint);

    void notifyStatusChanged(Complaint complaint);
}
