package customer_complaint.customer_complaint.exception;

// custom exception
public class EmailNotVerifiedException extends RuntimeException {

    public EmailNotVerifiedException(String message) {
        super(message);
    }
}
