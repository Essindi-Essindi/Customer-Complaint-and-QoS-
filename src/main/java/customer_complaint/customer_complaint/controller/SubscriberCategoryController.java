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

// endpoint definitions
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
