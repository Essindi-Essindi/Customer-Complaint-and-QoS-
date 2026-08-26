package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// kpi row data
@Getter
@Setter
@AllArgsConstructor
public class KpiResponse {

    private String groupLabel;
    private double averageResolutionTimeHours;
    private long totalComplaints;
    private long resolvedComplaints;
}
