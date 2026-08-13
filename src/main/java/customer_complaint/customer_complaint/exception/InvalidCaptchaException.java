package customer_complaint.customer_complaint.exception;

// thrown when a reCAPTCHA token is missing or fails Google's verification
public class InvalidCaptchaException extends RuntimeException {
    public InvalidCaptchaException(String message) {
        super(message);
    }
}