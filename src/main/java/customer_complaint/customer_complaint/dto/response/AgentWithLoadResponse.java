package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// agent info + how many complaints are currently assigned to them
// used by manager when assigning an agent to a complaint
@Getter
@Setter
@AllArgsConstructor
public class AgentWithLoadResponse {

    private Long id;
    private String name;
    private String email;
    private String assignedService;
    private String assignedRegion;
    private long assignedComplaintCount; // number of non-resolved complaints currently on this agent
}
