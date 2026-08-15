package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.request.LoginRequest;
import customer_complaint.customer_complaint.dto.request.RegisterSubscriberRequest;
import customer_complaint.customer_complaint.dto.response.AuthResponse;
import customer_complaint.customer_complaint.exception.AccountDisabledException;
import customer_complaint.customer_complaint.exception.DuplicateUserException;
import customer_complaint.customer_complaint.exception.InvalidCredentialsException;
import customer_complaint.customer_complaint.model.Agent;
import customer_complaint.customer_complaint.model.Manager;
import customer_complaint.customer_complaint.model.Subscriber;
import customer_complaint.customer_complaint.model.User;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.security.JwtTokenProvider;
import customer_complaint.customer_complaint.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// hashes password, issues jwt on success
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public AuthResponse register(RegisterSubscriberRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateUserException("Email already registered");
        }

        Subscriber subscriber = new Subscriber();
        subscriber.setName(request.getName());
        subscriber.setEmail(request.getEmail());
        subscriber.setPhone(request.getPhone());
        subscriber.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        subscriber.setCamtelAccountNumber(request.getCamtelAccountNumber());
        subscriber.setServiceType(request.getServiceType());

        userRepository.save(subscriber);

        String token = jwtTokenProvider.generateToken(subscriber.getEmail(), "SUBSCRIBER");
        return new AuthResponse(token, "SUBSCRIBER", subscriber.getId(), subscriber.getName(), null);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // FIX: a deactivated user was previously able to log in and get a brand-new valid token.
        if (!user.isActive()) {
            throw new AccountDisabledException("This account has been deactivated. Contact your administrator.");
        }

        String role = user.getClass().getSimpleName().toUpperCase();
        String token = jwtTokenProvider.generateToken(user.getEmail(), role);

        // Expose the agent's assigned service (= their department/team) so the
        // frontend can show it on the dashboard without a separate round-trip.
        String department = null;
        if (user instanceof Agent agent) {
            department = agent.getAssignedService();
        } else if (user instanceof Manager manager) {
            department = manager.getDepartment();
        }

        return new AuthResponse(token, role, user.getId(), user.getName(), department);
    }
}