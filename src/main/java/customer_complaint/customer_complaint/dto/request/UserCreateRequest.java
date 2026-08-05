package customer_complaint.customer_complaint.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// payload for manager creating agents/managers
@Getter
@Setter
public class UserCreateRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String phone;

    @NotBlank
    private String password;

    @NotBlank
    private String role;

    // Agent-specific
    private String assignedRegion;
    private String assignedService;

    // Manager-specific
    private String department;
}
