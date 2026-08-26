package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// lookup helper
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    Optional<Ticket> findByComplaintId(Long complaintId);
}
