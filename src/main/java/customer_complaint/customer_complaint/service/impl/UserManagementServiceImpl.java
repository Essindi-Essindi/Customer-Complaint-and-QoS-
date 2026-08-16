package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.request.UserCreateRequest;
import customer_complaint.customer_complaint.dto.request.UserUpdateRequest;
import customer_complaint.customer_complaint.dto.response.UserResponse;
import customer_complaint.customer_complaint.exception.DuplicateUserException;
import customer_complaint.customer_complaint.exception.ResourceNotFoundException;
import customer_complaint.customer_complaint.model.Agent;
import customer_complaint.customer_complaint.model.Manager;
import customer_complaint.customer_complaint.model.User;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// creates/updates agents and managers
@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateUserException("Email already in use");
        }

        User user = switch (request.getRole().toUpperCase()) {
            case "AGENT" -> {
                Agent agent = new Agent();
                agent.setAssignedRegion(request.getAssignedRegion());
                agent.setAssignedService(request.getAssignedService());
                yield agent;
            }
            case "MANAGER" -> {
                Manager manager = new Manager();
                manager.setDepartment(request.getDepartment());
                yield manager;
            }
            default -> throw new IllegalArgumentException("Unsupported role for staff creation: " + request.getRole());
        };

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);
        return toResponse(user);
    }

    @Override
    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getActive() != null) user.setActive(request.getActive());

        if (user instanceof Agent agent) {
            if (request.getAssignedRegion() != null) agent.setAssignedRegion(request.getAssignedRegion());
            if (request.getAssignedService() != null) agent.setAssignedService(request.getAssignedService());
        }

        if (user instanceof Manager manager && request.getDepartment() != null) {
            manager.setDepartment(request.getDepartment());
        }

        userRepository.save(user);
        return toResponse(user);
    }

    @Override
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    public Page<UserResponse> listUsers(String role, Pageable pageable) {
        // role already arrives uppercase from the frontend (Role type is
        // 'SUBSCRIBER' | 'AGENT' | 'MANAGER'), matching the @DiscriminatorValue
        // on each User subclass exactly, so it's passed straight through to
        // the query rather than re-derived from a class name.
        return userRepository.findPageByRole(role, pageable).map(this::toResponse);
    }

    private UserResponse toResponse(User user) {
        String role = user.getClass().getSimpleName().toUpperCase();
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), role, user.isActive());
    }
}
