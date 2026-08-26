package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.model.enums.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// query helpers
public interface ComplaintRepository extends JpaRepository<Complaint, Long>,
        JpaSpecificationExecutor<Complaint> {

    // custom finder
    Optional<Complaint> findByIdempotencyKey(String idempotencyKey);

    Optional<Complaint> findByTicketNumber(String ticketNumber);

    List<Complaint> findBySubscriberId(Long subscriberId);

    List<Complaint> findByAgentId(Long agentId);

    List<Complaint> findByRegionAndStatus(String region, ComplaintStatus status);

    List<Complaint> findByServiceTypeAndCreatedAtBetween(
            ServiceType serviceType,
            LocalDateTime start,
            LocalDateTime end);

    List<Complaint> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    // custom finder
    List<Complaint> findByServiceType(ServiceType serviceType);

    // count query
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.agent.id = :agentId AND c.status <> 'RESOLVED'")
    long countActiveByAgentId(@Param("agentId") Long agentId);
}