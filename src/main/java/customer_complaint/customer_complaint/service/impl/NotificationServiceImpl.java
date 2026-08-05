package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.messaging.SmsEventPublisher;
import customer_complaint.customer_complaint.messaging.SmsMessageEvent;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Notification;
import customer_complaint.customer_complaint.model.enums.NotificationStatus;
import customer_complaint.customer_complaint.repository.NotificationRepository;
import customer_complaint.customer_complaint.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// builds the sms text and queues it
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SmsEventPublisher smsEventPublisher;

    @Override
    public void notifyTicketCreated(Complaint complaint) {
        String message = "Your complaint " + complaint.getTicketNumber() + " has been received.";
        queueSms(complaint, message);
    }

    @Override
    public void notifyStatusChanged(Complaint complaint) {
        String message = "Your complaint " + complaint.getTicketNumber() + " is now " + complaint.getStatus() + ".";
        queueSms(complaint, message);
    }

    private void queueSms(Complaint complaint, String message) {
        Notification notification = new Notification();
        notification.setRecipient(complaint.getSubscriber());
        notification.setComplaint(complaint);
        notification.setMessage(message);
        notification.setType("SMS");
        notification.setStatus(NotificationStatus.QUEUED);
        notificationRepository.save(notification);

        smsEventPublisher.publish(new SmsMessageEvent(
                notification.getId(),
                complaint.getSubscriber().getPhone(),
                message));
    }
}
