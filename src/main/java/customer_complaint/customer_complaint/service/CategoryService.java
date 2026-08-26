package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.model.Category;

import java.util.List;

// handle service logic
public interface CategoryService {

    Category create(String name, String description);

    Category update(Long id, String name, String description);

    void delete(Long id);

    List<Category> listAll();
}
