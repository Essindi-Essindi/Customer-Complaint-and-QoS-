package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

// import summary details
@Getter
@AllArgsConstructor
public class AgentImportResultResponse {

    private int totalRows;
    private int importedCount;
    private int failedCount;
    private List<AgentImportRowResult> rows;
}
