package customer_complaint.customer_complaint.exception;

// custom exception
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
