package customer_complaint.customer_complaint.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// payload for login. `identifier` is either the account's email or phone
// number — a subscriber who registered phone-only has no email to log in
// with, so login can no longer assume email. Agents/managers always have an
// email and can keep using it here unchanged.
@Getter
@Setter
public class LoginRequest {

    @NotBlank
    private String identifier;

    @NotBlank
    private String password;
}
