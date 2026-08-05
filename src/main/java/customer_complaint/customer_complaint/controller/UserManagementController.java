package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.dto.request.UserCreateRequest;
import customer_complaint.customer_complaint.dto.request.UserUpdateRequest;
import customer_complaint.customer_complaint.dto.response.UserResponse;
import customer_complaint.customer_complaint.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// manager endpoints for user accounts
@RestController
@RequestMapping("/api/manager/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class UserManagementController {

    private final UserManagementService userManagementService;

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.ok(userManagementService.createUser(request));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> update(@PathVariable Long userId, @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userManagementService.updateUser(userId, request));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deactivate(@PathVariable Long userId) {
        userManagementService.deactivateUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> list(@RequestParam(required = false) String role) {
        return ResponseEntity.ok(userManagementService.listUsers(role));
    }
}
