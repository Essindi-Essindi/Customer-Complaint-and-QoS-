package customer_complaint.customer_complaint.exception;

// custom exception
public class AccountDisabledException extends RuntimeException {

    public AccountDisabledException(String message) {
        super(message);
    }
}