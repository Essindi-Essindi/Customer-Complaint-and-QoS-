package customer_complaint.customer_complaint.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// request payload
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

    // role specific
    private String assignedRegion;
    private String assignedService;

    // role specific
    private String department;
}
