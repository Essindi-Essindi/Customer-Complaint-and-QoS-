package customer_complaint.customer_complaint.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// payload for subscriber sign up
@Getter
@Setter
public class RegisterSubscriberRequest {

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
    private String camtelAccountNumber;

    @NotBlank
    private String serviceType;

    @NotBlank
    private String captchaToken;
}