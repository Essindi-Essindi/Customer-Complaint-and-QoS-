package customer_complaint.customer_complaint.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Queue;

// queues, exchange and bindings
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "complaint.exchange";
    public static final String SMS_QUEUE = "sms.queue";
    public static final String SMS_ROUTING_KEY = "sms.send";
    public static final String REPORT_QUEUE = "report.queue";
    public static final String REPORT_ROUTING_KEY = "report.generate";

    @Bean
    public TopicExchange complaintExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue smsQueue() {
        return new Queue(SMS_QUEUE, true);
    }

    @Bean
    public Queue reportQueue() {
        return new Queue(REPORT_QUEUE, true);
    }

    @Bean
    public Binding smsBinding(Queue smsQueue, TopicExchange complaintExchange) {
        return BindingBuilder.bind(smsQueue).to(complaintExchange).with(SMS_ROUTING_KEY);
    }

    @Bean
    public Binding reportBinding(Queue reportQueue, TopicExchange complaintExchange) {
        return BindingBuilder.bind(reportQueue).to(complaintExchange).with(REPORT_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
