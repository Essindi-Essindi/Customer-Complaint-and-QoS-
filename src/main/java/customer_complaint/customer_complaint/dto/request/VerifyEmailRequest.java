package customer_complaint.customer_complaint.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// payload for confirming the code emailed during registration
@Getter
@Setter
public class VerifyEmailRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String code;
}
