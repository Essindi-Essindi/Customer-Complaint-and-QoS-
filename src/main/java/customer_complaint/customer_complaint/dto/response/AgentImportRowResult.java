package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

// row-level import outcome
@Getter
@AllArgsConstructor
public class AgentImportRowResult {

    private int row;
    private String name;
    private String email;
    private boolean imported;
    private String message;
}
