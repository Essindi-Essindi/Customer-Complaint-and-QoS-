package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Resolution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// resolution for a complaint
public interface ResolutionRepository extends JpaRepository<Resolution, Long> {

    Optional<Resolution> findByComplaintId(Long complaintId);

    // Bulk lookup for a whole batch of complaints at once — used by
    // ReportServiceImpl to fold ratings into a PDF report's summary without
    // firing one query per complaint.
    List<Resolution> findByComplaintIdIn(List<Long> complaintIds);
}
