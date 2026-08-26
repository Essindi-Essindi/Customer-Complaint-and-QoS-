package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// region total data
@Getter
@Setter
@AllArgsConstructor
public class RegionTotalResponse {

    private String region;
    private long complaintCount;
}
