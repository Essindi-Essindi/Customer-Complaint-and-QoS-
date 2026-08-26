package customer_complaint.customer_complaint.exception;

// custom exception
public class InvalidVerificationCodeException extends RuntimeException {

    public InvalidVerificationCodeException(String message) {
        super(message);
    }
}
