package customer_complaint.customer_complaint.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

// request payload
@Getter
@Setter
public class ReportGenerationRequest {

    @NotBlank
    private String type;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;
}
