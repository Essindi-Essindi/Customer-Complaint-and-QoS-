package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Resolution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// lookup helper
public interface ResolutionRepository extends JpaRepository<Resolution, Long> {

    Optional<Resolution> findByComplaintId(Long complaintId);

    // bulk lookup
    List<Resolution> findByComplaintIdIn(List<Long> complaintIds);
}
