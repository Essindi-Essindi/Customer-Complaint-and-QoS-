package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// list row data
@Getter
@Setter
@AllArgsConstructor
public class ComplaintListItemResponse {

    private Long id;
    private String ticketNumber;
    private String type;
    private String serviceType; // extra field
    private String status;
    private String region;
    private LocalDateTime createdAt;
}