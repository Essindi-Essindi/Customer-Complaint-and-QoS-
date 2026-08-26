package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// pattern summary data
@Getter
@Setter
@AllArgsConstructor
public class RecurringPatternResponse {

    private String type;
    private String region;
    private long occurrences;
    private String windowDescription;
}
