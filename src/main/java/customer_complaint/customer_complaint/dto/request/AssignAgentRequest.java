package customer_complaint.customer_complaint.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

// request payload
@Getter
@Setter
public class AssignAgentRequest {

    @NotNull(message = "agentId is required")
    private Long agentId;
}
