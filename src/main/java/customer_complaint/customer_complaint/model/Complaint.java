package customer_complaint.customer_complaint.model;

import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.model.enums.ServiceType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// entity class
@Entity
@Table(name = "complaints", indexes = {
        @Index(name = "idx_complaint_region", columnList = "region"),
        @Index(name = "idx_complaint_status", columnList = "status"),
        @Index(name = "idx_complaint_service_type", columnList = "service_type"),
        @Index(name = "idx_complaint_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_number", length = 50)
    private String ticketNumber;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 36)
    private String idempotencyKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscriber_id", nullable = false)
    private Subscriber subscriber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private Agent agent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 100)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 50)
    private ServiceType serviceType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String region;

    @Column(length = 100)
    private String city;

    // entity field
    @Column(length = 100)
    private String locality;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintStatus status = ComplaintStatus.SUBMITTED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;
}
