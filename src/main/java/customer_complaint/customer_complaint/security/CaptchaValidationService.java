package customer_complaint.customer_complaint.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

// helper service
@Service
public class CaptchaValidationService {

    private static final Logger log = LoggerFactory.getLogger(CaptchaValidationService.class);

    @Value("${captcha.secret-key}")
    private String secretKey;

    @Value("${captcha.verify-url}")
    private String verifyUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isValid(String captchaToken) {
        if (captchaToken == null || captchaToken.isBlank()) {
            return false;
        }

        // build request
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", secretKey);
        form.add("response", captchaToken);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);

        try {
            Map<?, ?> result = restTemplate.postForObject(verifyUrl, request, Map.class);
            boolean success = result != null && Boolean.TRUE.equals(result.get("success"));
            if (!success) {
                log.warn("reCAPTCHA verification failed: {}", result);
            }
            return success;
        } catch (Exception ex) {
            // handle error
            log.error("Error calling reCAPTCHA verification endpoint", ex);
            return false;
        }
    }
}