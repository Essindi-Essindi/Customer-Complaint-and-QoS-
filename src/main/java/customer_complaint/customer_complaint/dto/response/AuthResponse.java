package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// auth result payload
@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {

    // set defaults
    private String token;
    private String role;
    private Long userId;
    private String name;
    // role-specific field
    private String department;
    private boolean emailVerificationRequired;
}
