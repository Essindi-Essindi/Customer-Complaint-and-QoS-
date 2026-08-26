package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// map data point
@Getter
@Setter
@AllArgsConstructor
public class HeatMapResponse {

    private String region;
    private String city;
    private long complaintCount;
}
