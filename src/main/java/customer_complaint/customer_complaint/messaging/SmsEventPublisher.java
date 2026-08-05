package customer_complaint.customer_complaint.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

// pushes an sms task onto the queue
@Component
@RequiredArgsConstructor
public class SmsEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publish(SmsMessageEvent event) {
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.SMS_ROUTING_KEY, event);
    }
}
