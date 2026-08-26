package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// report lookups
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByGeneratedByIdOrderByGeneratedAtDesc(Long managerId);
}
