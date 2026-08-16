package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// full complaint detail returned to client
@Getter
@Setter
@AllArgsConstructor
public class ComplaintResponse {

    private Long id;
    private String ticketNumber;
    private String type;
    private String serviceType;
    private String region;
    private String city;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
