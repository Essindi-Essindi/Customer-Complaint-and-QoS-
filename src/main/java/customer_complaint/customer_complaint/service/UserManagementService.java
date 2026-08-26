package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.request.UserCreateRequest;
import customer_complaint.customer_complaint.dto.request.UserUpdateRequest;
import customer_complaint.customer_complaint.dto.response.AgentImportResultResponse;
import customer_complaint.customer_complaint.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

// user management service
public interface UserManagementService {

    UserResponse createUser(UserCreateRequest request);

    UserResponse updateUser(Long userId, UserUpdateRequest request);

    void deactivateUser(Long userId);

    Page<UserResponse> listUsers(String role, Pageable pageable);

    // process request
    AgentImportResultResponse importAgents(MultipartFile file);
}
