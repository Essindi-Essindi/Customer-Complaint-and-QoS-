package customer_complaint.customer_complaint.exception;

// thrown when email/phone already registered
public class DuplicateUserException extends RuntimeException {

    public DuplicateUserException(String message) {
        super(message);
    }
}
