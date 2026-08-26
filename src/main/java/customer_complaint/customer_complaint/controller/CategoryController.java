package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.model.Category;
import customer_complaint.customer_complaint.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// endpoint setup
@RestController
@RequestMapping("/api/manager/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<Category> create(@RequestParam String name, @RequestParam(required = false) String description) {
        return ResponseEntity.ok(categoryService.create(name, description));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> update(@PathVariable Long id, @RequestParam String name,
                                            @RequestParam(required = false) String description) {
        return ResponseEntity.ok(categoryService.update(id, name, description));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<Category>> list() {
        return ResponseEntity.ok(categoryService.listAll());
    }
}
