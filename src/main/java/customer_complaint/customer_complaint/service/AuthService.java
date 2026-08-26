package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.request.LoginRequest;
import customer_complaint.customer_complaint.dto.request.RegisterSubscriberRequest;
import customer_complaint.customer_complaint.dto.request.ResendVerificationRequest;
import customer_complaint.customer_complaint.dto.request.VerifyEmailRequest;
import customer_complaint.customer_complaint.dto.response.AuthResponse;

// auth service
public interface AuthService {

    AuthResponse register(RegisterSubscriberRequest request);

    AuthResponse login(LoginRequest request);

    // process request
    AuthResponse verifyEmail(VerifyEmailRequest request);

    void resendVerificationCode(ResendVerificationRequest request);
}
