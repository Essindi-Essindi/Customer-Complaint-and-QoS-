package customer_complaint.customer_complaint.exception;

// thrown on bad login
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
