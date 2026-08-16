package customer_complaint.customer_complaint.exception;

// thrown when a verification code is wrong, expired, or the email is
// already verified
public class InvalidVerificationCodeException extends RuntimeException {

    public InvalidVerificationCodeException(String message) {
        super(message);
    }
}
