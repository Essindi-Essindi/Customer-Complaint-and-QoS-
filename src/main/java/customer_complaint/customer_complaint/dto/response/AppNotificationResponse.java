package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// notification row data
@Getter
@Setter
@AllArgsConstructor
public class AppNotificationResponse {

    private Long id;
    private String type;
    private String message;
    private String ticketNumber;
    private boolean read;
    private LocalDateTime createdAt;
}
