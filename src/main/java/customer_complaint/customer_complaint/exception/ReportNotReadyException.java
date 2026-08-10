package customer_complaint.customer_complaint.exception;

// thrown when a report's PDF hasn't finished generating yet
public class ReportNotReadyException extends RuntimeException {

    public ReportNotReadyException(String message) {
        super(message);
    }
}