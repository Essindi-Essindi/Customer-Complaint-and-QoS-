package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// one point on the heat map
@Getter
@Setter
@AllArgsConstructor
public class HeatMapResponse {

    private String region;
    private String city;
    private long complaintCount;
}
