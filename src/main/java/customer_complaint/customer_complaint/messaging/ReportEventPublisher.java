package customer_complaint.customer_complaint.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

// publish event
@Component
@RequiredArgsConstructor
public class ReportEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publish(ReportGenerationEvent event) {
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.REPORT_ROUTING_KEY, event);
    }
}
