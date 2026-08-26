package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// agent load info
@Getter
@Setter
@AllArgsConstructor
public class AgentWithLoadResponse {

    private Long id;
    private String name;
    private String email;
    private String assignedService;
    private String assignedRegion;
    private long assignedComplaintCount; // extra info
}
