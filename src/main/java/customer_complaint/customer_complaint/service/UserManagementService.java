package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.request.UserCreateRequest;
import customer_complaint.customer_complaint.dto.request.UserUpdateRequest;
import customer_complaint.customer_complaint.dto.response.AgentImportResultResponse;
import customer_complaint.customer_complaint.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

// manager crud on subscribers/agents
public interface UserManagementService {

    UserResponse createUser(UserCreateRequest request);

    UserResponse updateUser(Long userId, UserUpdateRequest request);

    void deactivateUser(Long userId);

    Page<UserResponse> listUsers(String role, Pageable pageable);

    // Bulk-creates AGENT accounts from an .xlsx "annuaire" (Name, Surname,
    // Service, Region, Password[, Phone]) — see
    // UserManagementServiceImpl.importAgents for the row-by-row contract.
    AgentImportResultResponse importAgents(MultipartFile file);
}
