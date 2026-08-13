package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// row shown in the manager's "all complaints" table (Dashboard Overview grid).
// Richer than ComplaintListItemResponse (subscriber/agent name, city, service)
// because the manager view needs to display and act on every complaint, not
// just a subscriber's own or an agent's assigned set.
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
    private String assignedAgentName; // null when unassigned
}