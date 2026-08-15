package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.messaging.SmsEventPublisher;
import customer_complaint.customer_complaint.messaging.SmsMessageEvent;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Notification;
import customer_complaint.customer_complaint.model.enums.NotificationStatus;
import customer_complaint.customer_complaint.repository.NotificationRepository;
import customer_complaint.customer_complaint.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

// builds the sms text and queues it
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

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
        String phone = complaint.getSubscriber().getPhone();

        Notification notification = new Notification();
        notification.setRecipient(complaint.getSubscriber());
        notification.setComplaint(complaint);
        notification.setMessage(message);
        notification.setType("SMS");

        // A subscriber can now register with email only and no phone at
        // all, so there may be nowhere to SMS. Record why rather than
        // queuing a doomed send to a null recipient.
        if (phone == null || phone.isBlank()) {
            notification.setStatus(NotificationStatus.FAILED);
            notificationRepository.save(notification);
            log.info("Subscriber {} has no phone on file — skipping SMS for complaint {}",
                    complaint.getSubscriber().getId(), complaint.getTicketNumber());
            return;
        }

        notification.setStatus(NotificationStatus.QUEUED);
        notificationRepository.save(notification);

        // FIX: rabbitTemplate.convertAndSend() used to be called directly here, uncaught. If the
        // broker is unreachable, this throws *after* the real business write above already
        // committed - the complaint status change genuinely succeeded, but the client still got a
        // 500 because a best-effort side-channel (queueing an SMS) blew up. We now log it and mark
        // the notification FAILED instead of propagating the exception - the caller still returns
        // 200 with the real result.
        try {
            smsEventPublisher.publish(new SmsMessageEvent(notification.getId(), phone, message));
        } catch (Exception ex) {
            log.warn("Could not queue SMS notification {} - broker may be unreachable", notification.getId(), ex);
            notification.setStatus(NotificationStatus.FAILED);
            notificationRepository.save(notification);
        }
    }
}