package customer_complaint.customer_complaint.exception;

// custom exception
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
