package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

// Summary + per-row detail for one agent annuaire import — see
// UserManagementServiceImpl.importAgents.
@Getter
@AllArgsConstructor
public class AgentImportResultResponse {

    private int totalRows;
    private int importedCount;
    private int failedCount;
    private List<AgentImportRowResult> rows;
}
