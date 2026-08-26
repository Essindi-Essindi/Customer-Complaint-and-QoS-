package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// lookup helper
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByComplaintId(Long complaintId);
}
