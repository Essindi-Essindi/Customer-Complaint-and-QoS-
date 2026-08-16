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

// queries backing the dashboard filters.
// JpaSpecificationExecutor backs GET /api/manager/complaints, which lists
// and filters every complaint (see ComplaintSpecifications).
public interface ComplaintRepository extends JpaRepository<Complaint, Long>,
        JpaSpecificationExecutor<Complaint> {

    // Enforces duplicate-submission protection at the query level
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

    // All complaints for a given service type — used by agent dashboard "service" tab
    List<Complaint> findByServiceType(ServiceType serviceType);

    // Count of non-resolved complaints per agent — used to compute agent load badge
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.agent.id = :agentId AND c.status <> 'RESOLVED'")
    long countActiveByAgentId(@Param("agentId") Long agentId);
}