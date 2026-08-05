package customer_complaint.customer_complaint.messaging;

import customer_complaint.customer_complaint.feign.SmsGatewayClient;
import customer_complaint.customer_complaint.model.Notification;
import customer_complaint.customer_complaint.model.enums.NotificationStatus;
import customer_complaint.customer_complaint.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

// consumes sms tasks and calls the gateway
@Component
@RequiredArgsConstructor
public class SmsEventListener {

    private final SmsGatewayClient smsGatewayClient;
    private final NotificationRepository notificationRepository;

    @RabbitListener(queues = RabbitMQConfig.SMS_QUEUE)
    public void handle(SmsMessageEvent event) {
        Notification notification = notificationRepository.findById(event.getNotificationId())
                .orElse(null);

        if (notification == null) {
            return;
        }

        try {
            smsGatewayClient.sendSms(new SmsGatewayClient.SmsRequest(event.getRecipientPhone(), event.getMessage()));
            notification.setStatus(NotificationStatus.SENT);
        } catch (Exception e) {
            notification.setStatus(NotificationStatus.FAILED);
        }

        notificationRepository.save(notification);
    }
}
