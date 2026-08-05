package customer_complaint.customer_complaint.messaging;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

// message payload for the sms queue
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SmsMessageEvent implements Serializable {

    private Long notificationId;
    private String recipientPhone;
    private String message;
}
