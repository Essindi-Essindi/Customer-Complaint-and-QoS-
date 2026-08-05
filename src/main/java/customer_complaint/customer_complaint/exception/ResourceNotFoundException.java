package customer_complaint.customer_complaint.exception;

// thrown when a lookup by id fails
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
