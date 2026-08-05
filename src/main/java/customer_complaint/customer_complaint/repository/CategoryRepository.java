package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// category lookups
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByName(String name);
}
