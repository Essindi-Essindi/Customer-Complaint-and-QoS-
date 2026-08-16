package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.dto.request.LoginRequest;
import customer_complaint.customer_complaint.dto.request.RegisterSubscriberRequest;
import customer_complaint.customer_complaint.dto.request.ResendVerificationRequest;
import customer_complaint.customer_complaint.dto.request.VerifyEmailRequest;
import customer_complaint.customer_complaint.dto.response.AuthResponse;
import customer_complaint.customer_complaint.exception.InvalidCaptchaException;
import customer_complaint.customer_complaint.security.CaptchaValidationService;
import customer_complaint.customer_complaint.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// register, login, and email verification endpoints
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CaptchaValidationService captchaValidationService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterSubscriberRequest request) {
        if (!captchaValidationService.isValid(request.getCaptchaToken())) {
            throw new InvalidCaptchaException("Captcha verification failed. Please try again.");
        }
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // Public — same as register/login, matched by SecurityConfig's
    // /api/auth/** permitAll. This is the last step of registration for an
    // email-registered account: on success it returns a token exactly like
    // login does, so the frontend can log the user straight in.
    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerificationCode(request);
        return ResponseEntity.ok().build();
    }
}
