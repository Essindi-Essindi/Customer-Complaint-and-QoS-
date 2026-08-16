package customer_complaint.customer_complaint.exception;

// thrown when login is attempted before the account's email is verified
public class EmailNotVerifiedException extends RuntimeException {

    public EmailNotVerifiedException(String message) {
        super(message);
    }
}
