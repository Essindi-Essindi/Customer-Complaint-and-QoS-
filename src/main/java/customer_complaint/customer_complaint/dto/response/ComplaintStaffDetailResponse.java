package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// Full complaint detail for agent/manager views — everything
// ComplaintResponse has (type, service, region, city, locality,
// description, status, dates) plus who submitted it and who's assigned.
// Deliberately a separate DTO from ComplaintResponse rather than adding
// these fields there: ComplaintResponse also backs the PUBLIC, unauthenticated
// GET /api/complaints/track/{ticketNumber} (permitAll in SecurityConfig,
// used by an anonymous ticket check) — putting subscriber name/email/phone
// on that response would leak subscriber PII to anyone who knows or
// guesses a ticket number. This DTO only ever comes back from the
// agent/manager-only endpoint in AgentComplaintController.
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

    private String assignedAgentName; // null when unassigned
}
