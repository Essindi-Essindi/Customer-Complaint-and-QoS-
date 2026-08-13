package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.dto.request.ComplaintSubmissionRequest;
import customer_complaint.customer_complaint.dto.request.RatingRequest;
import customer_complaint.customer_complaint.dto.response.ComplaintListItemResponse;
import customer_complaint.customer_complaint.dto.response.ComplaintResponse;
import customer_complaint.customer_complaint.exception.InvalidCaptchaException;
import customer_complaint.customer_complaint.security.CaptchaValidationService;
import customer_complaint.customer_complaint.security.CustomUserDetails;
import customer_complaint.customer_complaint.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// subscriber facing complaint endpoints
@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;
    private final CaptchaValidationService captchaValidationService;

    @PostMapping
    @PreAuthorize("hasRole('SUBSCRIBER')")
    public ResponseEntity<ComplaintResponse> submit(@AuthenticationPrincipal CustomUserDetails principal,
                                                    @Valid @RequestBody ComplaintSubmissionRequest request) {
        if (!captchaValidationService.isValid(request.getCaptchaToken())) {
            throw new InvalidCaptchaException("Captcha verification failed. Please try again.");
        }
        return ResponseEntity.ok(complaintService.submit(principal.getUser().getId(), request));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('SUBSCRIBER')")
    public ResponseEntity<List<ComplaintListItemResponse>> listMine(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(complaintService.listForSubscriber(principal.getUser().getId()));
    }

    @GetMapping("/track/{ticketNumber}")
    public ResponseEntity<ComplaintResponse> track(@PathVariable String ticketNumber) {
        return ResponseEntity.ok(complaintService.track(ticketNumber));
    }

    @PostMapping("/{complaintId}/rate")
    @PreAuthorize("hasRole('SUBSCRIBER')")
    public ResponseEntity<Void> rate(@PathVariable Long complaintId, @Valid @RequestBody RatingRequest request) {
        complaintService.rate(complaintId, request);
        return ResponseEntity.ok().build();
    }
}