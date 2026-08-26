package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Notification;
import customer_complaint.customer_complaint.model.enums.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// custom finders
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByComplaintId(Long complaintId);

    List<Notification> findByStatus(NotificationStatus status);
}
