package customer_complaint.customer_complaint.messaging;

import customer_complaint.customer_complaint.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

// handle event
@Component
@RequiredArgsConstructor
public class ReportEventListener {

    private final ReportService reportService;

    @RabbitListener(queues = RabbitMQConfig.REPORT_QUEUE)
    public void handle(ReportGenerationEvent event) {
        reportService.generatePdf(event);
    }
}
