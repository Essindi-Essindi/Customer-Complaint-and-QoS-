package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Subscriber;

// every subscriber-facing email the app sends
public interface EmailService {

    void sendVerificationCode(Subscriber subscriber, String code);

    void sendWelcomeEmail(Subscriber subscriber);

    // No-ops (does nothing) unless complaint.getStatus() is one of
    // SUBMITTED / ASSIGNED / RESOLVED, or the subscriber has no email on
    // file — see the implementation for exactly which statuses email.
    void sendComplaintStatusEmail(Complaint complaint);
}
