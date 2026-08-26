package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// manager list row data
@Getter
@Setter
@AllArgsConstructor
public class ComplaintManagerListItemResponse {

    private Long id;
    private String ticketNumber;
    private String subscriberName;
    private String type;
    private String serviceType;
    private String region;
    private String city;
    private String status;
    private LocalDateTime createdAt;
    private String assignedAgentName; // may be empty
}