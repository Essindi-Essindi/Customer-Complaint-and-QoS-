package customer_complaint.customer_complaint.exception;

// custom exception
public class ReportNotReadyException extends RuntimeException {

    public ReportNotReadyException(String message) {
        super(message);
    }
}