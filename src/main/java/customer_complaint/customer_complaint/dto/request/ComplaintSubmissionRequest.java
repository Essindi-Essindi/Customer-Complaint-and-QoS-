package customer_complaint.customer_complaint.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// payload for submitting a complaint
@Getter
@Setter
public class ComplaintSubmissionRequest {

    @NotBlank
    private String idempotencyKey;

    @NotBlank
    private String type;

    @NotBlank
    private String serviceType;

    @NotBlank
    private String region;

    @NotBlank
    private String city;

    private String description;

    private Long categoryId;

    @NotBlank
    private String captchaToken;
}