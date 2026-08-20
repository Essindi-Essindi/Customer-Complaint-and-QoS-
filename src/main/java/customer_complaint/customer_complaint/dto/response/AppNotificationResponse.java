package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// one in-app notification row, as shown in the bell dropdown / toast popup
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
