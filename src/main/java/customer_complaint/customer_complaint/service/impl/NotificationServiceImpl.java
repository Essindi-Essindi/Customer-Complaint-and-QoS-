package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.messaging.SmsEventPublisher;
import customer_complaint.customer_complaint.messaging.SmsMessageEvent;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Notification;
import customer_complaint.customer_complaint.model.enums.NotificationStatus;
import customer_complaint.customer_complaint.repository.NotificationRepository;
import customer_complaint.customer_complaint.service.EmailService;
import customer_complaint.customer_complaint.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

// handle service logic
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final SmsEventPublisher smsEventPublisher;
    private final EmailService emailService;

    @Override
    public void notifyTicketCreated(Complaint complaint) {
        String message = "Your complaint " + complaint.getTicketNumber() + " has been received.";
        queueSms(complaint, message);
        emailService.sendComplaintStatusEmail(complaint);
    }

    @Override
    public void notifyStatusChanged(Complaint complaint) {
        String message = "Your complaint " + complaint.getTicketNumber() + " is now " + complaint.getStatus() + ".";
        queueSms(complaint, message);
        emailService.sendComplaintStatusEmail(complaint);
    }

    private void queueSms(Complaint complaint, String message) {
        String phone = complaint.getSubscriber().getPhone();

        Notification notification = new Notification();
        notification.setRecipient(complaint.getSubscriber());
        notification.setComplaint(complaint);
        notification.setMessage(message);
        notification.setType("SMS");

        // check status
        if (phone == null || phone.isBlank()) {
            notification.setStatus(NotificationStatus.FAILED);
            notificationRepository.save(notification);
            log.info("Subscriber {} has no phone on file — skipping SMS for complaint {}",
                    complaint.getSubscriber().getId(), complaint.getTicketNumber());
            return;
        }

        notification.setStatus(NotificationStatus.QUEUED);
        notificationRepository.save(notification);

        // handle error
        try {
            smsEventPublisher.publish(new SmsMessageEvent(notification.getId(), phone, message));
        } catch (Exception ex) {
            log.warn("Could not queue SMS notification {} - broker may be unreachable", notification.getId(), ex);
            notification.setStatus(NotificationStatus.FAILED);
            notificationRepository.save(notification);
        }
    }
}