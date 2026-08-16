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

    // Optional — not every city has a curated locality list, and "Other" is
    // always a valid choice even when it does.
    private String locality;

    private String description;

    private Long categoryId;

    @NotBlank
    private String captchaToken;
}