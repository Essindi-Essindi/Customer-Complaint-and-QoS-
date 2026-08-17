package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

// One row's outcome from an agent annuaire (.xlsx) import. `email` carries
// the final address actually used — which may differ from the naive
// surname.name@camtel.com guess if that address collided with an existing
// account, in which case a digit suffix was appended (see
// UserManagementServiceImpl.uniqueEmail) — so the manager always sees the
// real login the imported agent should use, not a stale draft of it.
@Getter
@AllArgsConstructor
public class AgentImportRowResult {

    private int row;
    private String name;
    private String email;
    private boolean imported;
    private String message;
}
