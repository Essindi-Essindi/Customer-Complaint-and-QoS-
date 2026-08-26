package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// auth result data
@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {

    // may be null
    private String token;
    private String role;
    private Long userId;
    private String name;
    // depends on role
    private String department;
    private boolean emailVerificationRequired;
}
