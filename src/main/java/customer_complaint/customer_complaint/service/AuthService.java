package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.request.LoginRequest;
import customer_complaint.customer_complaint.dto.request.RegisterSubscriberRequest;
import customer_complaint.customer_complaint.dto.response.AuthResponse;

// register and login
public interface AuthService {

    AuthResponse register(RegisterSubscriberRequest request);

    AuthResponse login(LoginRequest request);
}
