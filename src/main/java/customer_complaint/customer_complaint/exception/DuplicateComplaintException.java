package customer_complaint.customer_complaint.exception;

// custom exception
public class DuplicateComplaintException extends RuntimeException {

    public DuplicateComplaintException(String message) {
        super(message);
    }
}
