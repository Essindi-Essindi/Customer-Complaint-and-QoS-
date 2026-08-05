package customer_complaint.customer_complaint.messaging;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDate;

// message payload for the report queue
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportGenerationEvent implements Serializable {

    private Long reportId;
    private String type;
    private LocalDate startDate;
    private LocalDate endDate;
}
