package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// queries backing the dashboard filters.
// JpaSpecificationExecutor backs GET /api/manager/complaints, which lists
// and filters every complaint (see ComplaintSpecifications) - the manager
// dashboard table needs this since none of the findBy... methods below
// return the *entire* complaint set with combinable, optional filters.
public interface ComplaintRepository extends JpaRepository<Complaint, Long>,
        JpaSpecificationExecutor<Complaint> {

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