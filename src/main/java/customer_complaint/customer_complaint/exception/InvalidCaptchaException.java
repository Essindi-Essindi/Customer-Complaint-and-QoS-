package customer_complaint.customer_complaint.exception;

// custom exception
public class InvalidCaptchaException extends RuntimeException {
    public InvalidCaptchaException(String message) {
        super(message);
    }
}