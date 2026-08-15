package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.model.Category;
import customer_complaint.customer_complaint.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Read-only category list for the complaint submission form. Deliberately a
// separate controller from CategoryController: that one is mapped under
// /api/manager/categories, which SecurityConfig locks to hasRole('MANAGER')
// at the URL level, so a subscriber can never reach it no matter what
// @PreAuthorize says. This lives outside /api/manager/** instead, so
// whatever categories a manager creates/edits/deletes on the configuration
// page are immediately reflected here too — same CategoryService, same data.
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class SubscriberCategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @PreAuthorize("hasRole('SUBSCRIBER')")
    public ResponseEntity<List<Category>> list() {
        return ResponseEntity.ok(categoryService.listAll());
    }
}
