package customer_complaint.customer_complaint.exception;

// custom exception
public class DuplicateUserException extends RuntimeException {

    public DuplicateUserException(String message) {
        super(message);
    }
}
