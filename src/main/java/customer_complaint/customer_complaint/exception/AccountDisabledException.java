package customer_complaint.customer_complaint.exception;

// thrown when a deactivated user tries to log in
public class AccountDisabledException extends RuntimeException {

    public AccountDisabledException(String message) {
        super(message);
    }
}