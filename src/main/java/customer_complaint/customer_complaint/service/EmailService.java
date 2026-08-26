package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Subscriber;

// handle service logic
public interface EmailService {

    void sendVerificationCode(Subscriber subscriber, String code);

    void sendWelcomeEmail(Subscriber subscriber);

    // send notification
    void sendComplaintStatusEmail(Complaint complaint);
}
