package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

// metadata for a generated report
@Getter
@Setter
@AllArgsConstructor
public class ReportResponse {

    private Long id;
    private String type;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime generatedAt;
    private String filePath;
}
