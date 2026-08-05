package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Ticket;

// ticket number generation
public interface TicketService {

    Ticket generateFor(Complaint complaint);

    String nextTicketNumber();
}
