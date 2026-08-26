package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.model.enums.ServiceType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

// optional filter builders
public final class ComplaintSpecifications {

    private ComplaintSpecifications() {
    }

    public static Specification<Complaint> hasType(String type) {
        if (type == null || type.isBlank()) return null;
        return (root, query, cb) -> cb.equal(root.get("type"), type);
    }

    public static Specification<Complaint> hasServiceType(ServiceType serviceType) {
        if (serviceType == null) return null;
        return (root, query, cb) -> cb.equal(root.get("serviceType"), serviceType);
    }

    public static Specification<Complaint> hasRegion(String region) {
        if (region == null || region.isBlank()) return null;
        return (root, query, cb) -> cb.equal(root.get("region"), region);
    }

    public static Specification<Complaint> hasStatus(ComplaintStatus status) {
        if (status == null) return null;
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Complaint> createdBetween(LocalDateTime start, LocalDateTime end) {
        if (start == null && end == null) return null;
        if (start != null && end != null) {
            return (root, query, cb) -> cb.between(root.get("createdAt"), start, end);
        }
        if (start != null) {
            return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), start);
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), end);
    }
}