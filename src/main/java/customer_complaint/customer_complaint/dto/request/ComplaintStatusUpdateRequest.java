package customer_complaint.customer_complaint.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// request payload
@Getter
@Setter
public class ComplaintStatusUpdateRequest {

    @NotBlank
    private String newStatus;

    private String resolutionNote;
}
