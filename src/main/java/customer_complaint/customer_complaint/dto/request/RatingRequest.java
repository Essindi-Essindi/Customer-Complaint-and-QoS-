package customer_complaint.customer_complaint.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

// request payload
@Getter
@Setter
public class RatingRequest {

    @Min(1)
    @Max(5)
    private int score;

    private String comment;
}
