package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.request.LoginRequest;
import customer_complaint.customer_complaint.dto.request.RegisterSubscriberRequest;
import customer_complaint.customer_complaint.dto.response.AuthResponse;
import customer_complaint.customer_complaint.exception.DuplicateUserException;
import customer_complaint.customer_complaint.exception.InvalidCredentialsException;
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
        return new AuthResponse(token, "SUBSCRIBER", subscriber.getId(), subscriber.getName());
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String role = user.getClass().getSimpleName().toUpperCase();
        String token = jwtTokenProvider.generateToken(user.getEmail(), role);
        return new AuthResponse(token, role, user.getId(), user.getName());
    }
}
