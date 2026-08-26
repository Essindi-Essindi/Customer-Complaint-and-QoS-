package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.AppNotification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

// query helpers
public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {

    // fetch records
    List<AppNotification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);

    // fetch new items
    List<AppNotification> findByRecipientIdAndCreatedAtAfterOrderByCreatedAtDesc(Long recipientId, LocalDateTime after);

    long countByRecipientIdAndReadFalse(Long recipientId);

    @Modifying
    @Query("UPDATE AppNotification n SET n.read = true WHERE n.recipient.id = :recipientId AND n.read = false")
    void markAllRead(@Param("recipientId") Long recipientId);

    @Modifying
    @Query("UPDATE AppNotification n SET n.read = true WHERE n.id = :id AND n.recipient.id = :recipientId")
    void markRead(@Param("id") Long id, @Param("recipientId") Long recipientId);
}
