package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.request.LoginRequest;
import customer_complaint.customer_complaint.dto.request.RegisterSubscriberRequest;
import customer_complaint.customer_complaint.dto.request.ResendVerificationRequest;
import customer_complaint.customer_complaint.dto.request.VerifyEmailRequest;
import customer_complaint.customer_complaint.dto.response.AuthResponse;
import customer_complaint.customer_complaint.exception.AccountDisabledException;
import customer_complaint.customer_complaint.exception.DuplicateUserException;
import customer_complaint.customer_complaint.exception.EmailNotVerifiedException;
import customer_complaint.customer_complaint.exception.InvalidCredentialsException;
import customer_complaint.customer_complaint.exception.InvalidVerificationCodeException;
import customer_complaint.customer_complaint.exception.ResourceNotFoundException;
import customer_complaint.customer_complaint.model.Agent;
import customer_complaint.customer_complaint.model.Manager;
import customer_complaint.customer_complaint.model.Subscriber;
import customer_complaint.customer_complaint.model.User;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.security.JwtTokenProvider;
import customer_complaint.customer_complaint.service.AuthService;
import customer_complaint.customer_complaint.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

// auth service impl
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int VERIFICATION_CODE_VALID_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;

    @Override
    public AuthResponse register(RegisterSubscriberRequest request) {
        // check status
        String email = blankToNull(request.getEmail());
        String phone = blankToNull(request.getPhone());

        if (email != null && userRepository.existsByEmail(email)) {
            throw new DuplicateUserException("Email already registered");
        }
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new DuplicateUserException("Phone number already registered");
        }

        Subscriber subscriber = new Subscriber();
        subscriber.setName(request.getName());
        subscriber.setEmail(email);
        subscriber.setPhone(phone);
        subscriber.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        subscriber.setCamtelAccountNumber(request.getCamtelAccountNumber());
        subscriber.setServiceType(request.getServiceType());

        // check status
        boolean needsVerification = email != null;
        if (needsVerification) {
            subscriber.setEmailVerified(false);
            subscriber.setVerificationCode(generateCode());
            subscriber.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(VERIFICATION_CODE_VALID_MINUTES));
        }

        userRepository.save(subscriber);

        if (needsVerification) {
            emailService.sendVerificationCode(subscriber, subscriber.getVerificationCode());
            // check status
            return new AuthResponse(null, "SUBSCRIBER", subscriber.getId(), subscriber.getName(), null, true);
        }

        String token = jwtTokenProvider.generateToken(String.valueOf(subscriber.getId()), "SUBSCRIBER");
        return new AuthResponse(token, "SUBSCRIBER", subscriber.getId(), subscriber.getName(), null, false);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrPhone(request.getIdentifier())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        // check status
        if (!user.isActive()) {
            throw new AccountDisabledException("This account has been deactivated. Contact your administrator.");
        }

        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException(
                    "Please verify your email before logging in. Check your inbox for the verification code.");
        }

        String role = user.getClass().getSimpleName().toUpperCase();
        String token = jwtTokenProvider.generateToken(String.valueOf(user.getId()), role);

        // set value
        String department = null;
        if (user instanceof Agent agent) {
            department = agent.getAssignedService();
        } else if (user instanceof Manager manager) {
            department = manager.getDepartment();
        }

        return new AuthResponse(token, role, user.getId(), user.getName(), department, false);
    }

    @Override
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found for that email"));

        if (user.isEmailVerified()) {
            throw new InvalidVerificationCodeException("This email is already verified");
        }

        boolean codeMatches = user.getVerificationCode() != null
                && user.getVerificationCode().equals(request.getCode());
        boolean notExpired = user.getVerificationCodeExpiresAt() != null
                && user.getVerificationCodeExpiresAt().isAfter(LocalDateTime.now());

        if (!codeMatches || !notExpired) {
            throw new InvalidVerificationCodeException("Invalid or expired verification code");
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiresAt(null);
        userRepository.save(user);

        if (user instanceof Subscriber subscriber) {
            emailService.sendWelcomeEmail(subscriber);
        }

        String role = user.getClass().getSimpleName().toUpperCase();
        String token = jwtTokenProvider.generateToken(String.valueOf(user.getId()), role);

        String department = null;
        if (user instanceof Agent agent) {
            department = agent.getAssignedService();
        } else if (user instanceof Manager manager) {
            department = manager.getDepartment();
        }

        return new AuthResponse(token, role, user.getId(), user.getName(), department, false);
    }

    @Override
    public void resendVerificationCode(ResendVerificationRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found for that email"));

        if (user.isEmailVerified()) {
            throw new InvalidVerificationCodeException("This email is already verified");
        }

        user.setVerificationCode(generateCode());
        user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(VERIFICATION_CODE_VALID_MINUTES));
        userRepository.save(user);

        if (user instanceof Subscriber subscriber) {
            emailService.sendVerificationCode(subscriber, user.getVerificationCode());
        }
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    // helper method
    private static String generateCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }
}
