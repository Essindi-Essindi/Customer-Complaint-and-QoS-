package customer_complaint.customer_complaint.dto.request;

import customer_complaint.customer_complaint.dto.validation.EmailOrPhoneRequired;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

// payload for subscriber sign up.
// email and phone are each individually optional — the frontend lets the
// subscriber pick email-only, phone-only, or both via a contact-method
// selector — but @EmailOrPhoneRequired rejects the request if neither is
// present.
@Getter
@Setter
@EmailOrPhoneRequired
public class RegisterSubscriberRequest {

    @NotBlank
    private String name;

    @Email
    private String email;

    @Pattern(regexp = "\\d{9,12}", message = "Invalid phone number")
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
