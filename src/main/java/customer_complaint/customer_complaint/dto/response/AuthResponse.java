package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// returned after login/register/verify-email
@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {

    // Null when emailVerificationRequired is true: a subscriber who
    // registered with an email gets no JWT until they verify it via
    // VerifyEmailRequest, so simply registering can't reach any
    // authenticated endpoint.
    private String token;
    private String role;
    private Long userId;
    private String name;
    // For agents: the service they are assigned to (MOBILE / ADSL / FTTH).
    // For managers: their department. Null for subscribers.
    private String department;
    private boolean emailVerificationRequired;
}
