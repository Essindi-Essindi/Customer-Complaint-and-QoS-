package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.request.LoginRequest;
import customer_complaint.customer_complaint.dto.request.RegisterSubscriberRequest;
import customer_complaint.customer_complaint.dto.request.ResendVerificationRequest;
import customer_complaint.customer_complaint.dto.request.VerifyEmailRequest;
import customer_complaint.customer_complaint.dto.response.AuthResponse;

// register, login, and email verification
public interface AuthService {

    AuthResponse register(RegisterSubscriberRequest request);

    AuthResponse login(LoginRequest request);

    // Confirms the code emailed during registration and, on success, issues
    // a token the same way login() does — verification is effectively the
    // last step of registration for an email-registered account.
    AuthResponse verifyEmail(VerifyEmailRequest request);

    void resendVerificationCode(ResendVerificationRequest request);
}
