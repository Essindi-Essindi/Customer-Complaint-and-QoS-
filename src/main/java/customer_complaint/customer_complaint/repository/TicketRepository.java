package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// ticket lookups by number or complaint
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    Optional<Ticket> findByComplaintId(Long complaintId);
}
