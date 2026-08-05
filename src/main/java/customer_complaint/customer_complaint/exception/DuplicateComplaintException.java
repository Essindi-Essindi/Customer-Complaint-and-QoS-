package customer_complaint.customer_complaint.exception;

// thrown when idempotency key already exists
public class DuplicateComplaintException extends RuntimeException {

    public DuplicateComplaintException(String message) {
        super(message);
    }
}
