package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// queries backing the dashboard filters
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    // Enforces duplicate-submission protection at the query level
    Optional<Complaint> findByIdempotencyKey(String idempotencyKey);

    List<Complaint> findBySubscriberId(Long subscriberId);

    List<Complaint> findByAgentId(Long agentId);

    List<Complaint> findByRegionAndStatus(String region, ComplaintStatus status);

    List<Complaint> findByServiceTypeAndCreatedAtBetween(
            customer_complaint.customer_complaint.model.enums.ServiceType serviceType,
            LocalDateTime start,
            LocalDateTime end);

    List<Complaint> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
