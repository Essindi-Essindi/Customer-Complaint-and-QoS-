package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// row shown in a complaint list
@Getter
@Setter
@AllArgsConstructor
public class ComplaintListItemResponse {

    private Long id;
    private String ticketNumber;
    private String type;
    private String serviceType; // added so agent dashboard can display service complaints tab
    private String status;
    private String region;
    private LocalDateTime createdAt;
}