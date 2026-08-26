package customer_complaint.customer_complaint.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// request payload
@Getter
@Setter
public class LoginRequest {

    @NotBlank
    private String identifier;

    @NotBlank
    private String password;
}
