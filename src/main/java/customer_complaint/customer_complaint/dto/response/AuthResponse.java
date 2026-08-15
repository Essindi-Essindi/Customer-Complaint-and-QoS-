package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// returned after login/register
@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String role;
    private Long userId;
    private String name;
    // For agents: the service they are assigned to (MOBILE / ADSL / FTTH).
    // For managers: their department. Null for subscribers.
    private String department;
}