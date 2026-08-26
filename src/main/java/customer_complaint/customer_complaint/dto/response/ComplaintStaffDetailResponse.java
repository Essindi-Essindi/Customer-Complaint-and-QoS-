package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// staff detail data
@Getter
@Setter
@AllArgsConstructor
public class ComplaintStaffDetailResponse {

    private Long id;
    private String ticketNumber;
    private String type;
    private String serviceType;
    private String region;
    private String city;
    private String locality;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String subscriberName;
    private String subscriberEmail;
    private String subscriberPhone;

    private String assignedAgentName; // may be null
}
