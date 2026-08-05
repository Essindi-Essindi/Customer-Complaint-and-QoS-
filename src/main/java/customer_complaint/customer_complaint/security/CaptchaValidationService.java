package customer_complaint.customer_complaint.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

// Verifies hCaptcha/reCAPTCHA before a complaint submission proceeds
// checks captcha token before submission
@Service
public class CaptchaValidationService {

    @Value("${captcha.secret-key}")
    private String secretKey;

    @Value("${captcha.verify-url}")
    private String verifyUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isValid(String captchaToken) {
        Map<String, String> params = Map.of("secret", secretKey, "response", captchaToken);
        Map<?, ?> result = restTemplate.postForObject(verifyUrl, params, Map.class);
        return result != null && Boolean.TRUE.equals(result.get("success"));
    }
}
