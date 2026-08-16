package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.request.ReportGenerationRequest;
import customer_complaint.customer_complaint.dto.response.ReportResponse;
import customer_complaint.customer_complaint.exception.ReportNotReadyException;
import customer_complaint.customer_complaint.exception.ResourceNotFoundException;
import customer_complaint.customer_complaint.messaging.ReportEventPublisher;
import customer_complaint.customer_complaint.messaging.ReportGenerationEvent;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Manager;
import customer_complaint.customer_complaint.model.Report;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.model.enums.ReportType;
import customer_complaint.customer_complaint.repository.ComplaintRepository;
import customer_complaint.customer_complaint.repository.ReportRepository;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

// creates the report row, pdf built async
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportServiceImpl.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter DATE_ONLY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final float MARGIN = 50f;
    private static final float LEADING = 16f;
    private static final float LOGO_SIZE = 34f;
    private static final String LOGO_RESOURCE = "/branding/camtel-logo.png";

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final ReportEventPublisher reportEventPublisher;

    @Value("${report.storage-dir:reports}")
    private String storageDir;

    @Override
    public ReportResponse requestGeneration(Long managerId, ReportGenerationRequest request) {
        Manager manager = (Manager) userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        Report report = new Report();
        report.setGeneratedBy(manager);
        report.setType(parseReportType(request.getType()));
        report.setStartDate(request.getStartDate());
        report.setEndDate(request.getEndDate());
        reportRepository.save(report);

        // Same reasoning as NotificationServiceImpl.queueSms: the Report row above is already
        // saved successfully, so if the broker is unreachable we don't want to fail the whole
        // request. The PDF simply stays pending (filePath null) until the queue is back;
        // downloading it in the meantime already returns a clean "not ready" response via
        // getReportForDownload(), so this degrades gracefully instead of lying about a failure.
        try {
            reportEventPublisher.publish(new ReportGenerationEvent(
                    report.getId(), report.getType().name(), report.getStartDate(), report.getEndDate()));
        } catch (Exception ex) {
            log.warn("Could not queue report generation for report {} - broker may be unreachable",
                    report.getId(), ex);
        }

        return toResponse(report);
    }

    @Override
    @Transactional
    public void generatePdf(ReportGenerationEvent event) {
        Report report = reportRepository.findById(event.getReportId())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        List<Complaint> complaints = complaintRepository.findByCreatedAtBetween(
                event.getStartDate().atStartOfDay(), event.getEndDate().plusDays(1).atStartOfDay());

        try {
            Path dir = Paths.get(storageDir);
            Files.createDirectories(dir);

            Path filePath = dir.resolve("report-" + report.getId() + ".pdf");
            writePdf(report, complaints, filePath);

            report.setFilePath(filePath.toString());
            reportRepository.save(report);
        } catch (IOException e) {
            // Leave filePath null so getReportForDownload() keeps reporting
            // "not ready" instead of pointing at a file that doesn't exist.
            log.error("Failed to generate PDF for report {}", report.getId(), e);
        }
    }

    // CAMTEL corporate report template — mirrors the layout of the
    // reference "2026_ACTIVITY_REPORT_..." document (repo root): a header
    // box on every page with the logo top-left, title top-center, and a
    // Code/Version/Date/Page metadata block top-right, under a rule line.
    // Only the layout is borrowed — the reference document's own content
    // (server-storage risk tables etc.) is unrelated to what this report
    // actually is, so the heading text and body are this report's own.
    // There's no internal document-code system behind this app's reports,
    // so Code is left as the literal string "null" rather than inventing one.
    private void writePdf(Report report, List<Complaint> complaints, Path filePath) throws IOException {
        Map<ComplaintStatus, Long> byStatus = new EnumMap<>(ComplaintStatus.class);
        for (Complaint c : complaints) {
            byStatus.merge(c.getStatus(), 1L, Long::sum);
        }

        try (PDDocument document = new PDDocument()) {
            PDImageXObject logo = loadLogo(document);
            int pageNumber = 1;

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(document, page);
            float x = MARGIN;
            float y = drawHeader(cs, page, logo, report, pageNumber);

            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
            cs.newLineAtOffset(x, y);
            cs.showText("Period: " + report.getStartDate() + " to " + report.getEndDate());
            cs.endText();
            y -= LEADING;

            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
            cs.newLineAtOffset(x, y);
            cs.showText("Generated by: " + report.getGeneratedBy().getName()
                    + " on " + report.getGeneratedAt().format(DATE_FMT));
            cs.endText();
            y -= LEADING * 2;

            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
            cs.newLineAtOffset(x, y);
            cs.showText("Summary (" + complaints.size() + " complaints)");
            cs.endText();
            y -= LEADING;

            for (ComplaintStatus status : ComplaintStatus.values()) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                cs.newLineAtOffset(x, y);
                cs.showText("  " + status + ": " + byStatus.getOrDefault(status, 0L));
                cs.endText();
                y -= LEADING;
            }
            y -= LEADING;

            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
            cs.newLineAtOffset(x, y);
            cs.showText("Complaints");
            cs.endText();
            y -= LEADING;

            for (Complaint c : complaints) {
                if (y < MARGIN + LEADING) {
                    cs.close();
                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);
                    cs = new PDPageContentStream(document, page);
                    pageNumber++;
                    y = drawHeader(cs, page, logo, report, pageNumber);
                }

                String line = String.format("%-16s %-14s %-10s %-14s %s",
                        c.getTicketNumber(), c.getServiceType(), c.getStatus(),
                        c.getRegion(), c.getCreatedAt().format(DATE_FMT));

                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
                cs.newLineAtOffset(x, y);
                cs.showText(line);
                cs.endText();
                y -= LEADING;
            }

            cs.close();
            document.save(filePath.toFile());
        }
    }

    /**
     * Draws the CAMTEL header box (logo, title, Code/Version/Date/Page
     * metadata, rule line) at the top of the given page and returns the y
     * coordinate body content should start writing at.
     */
    private float drawHeader(PDPageContentStream cs, PDPage page, PDImageXObject logo, Report report,
                              int pageNumber) throws IOException {
        float pageWidth = page.getMediaBox().getWidth();
        float top = page.getMediaBox().getHeight() - MARGIN;

        if (logo != null) {
            cs.drawImage(logo, MARGIN, top - LOGO_SIZE, LOGO_SIZE, LOGO_SIZE);
        }

        float titleX = MARGIN + LOGO_SIZE + 12f;
        cs.beginText();
        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
        cs.newLineAtOffset(titleX, top - 12f);
        cs.showText("CAMTEL ACTIVITY REPORT");
        cs.endText();

        cs.beginText();
        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
        cs.newLineAtOffset(titleX, top - 26f);
        cs.showText("Complaint Management — " + report.getType() + " Report");
        cs.endText();

        // Code/Version/Date/Page metadata block, top-right — same fields the
        // reference CAMTEL template carries on every page. No formal
        // document-code system backs these reports, so Code stays "null"
        // rather than inventing one.
        float metaX = pageWidth - MARGIN - 150f;
        float metaY = top - 2f;
        String[] metaLines = {
                "Code : null",
                "Version : 001",
                "Date : " + report.getGeneratedAt().format(DATE_ONLY_FMT),
                "Page : " + pageNumber,
        };
        for (String line : metaLines) {
            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
            cs.newLineAtOffset(metaX, metaY);
            cs.showText(line);
            cs.endText();
            metaY -= 11f;
        }

        float ruleY = top - LOGO_SIZE - 8f;
        cs.setLineWidth(1f);
        cs.moveTo(MARGIN, ruleY);
        cs.lineTo(pageWidth - MARGIN, ruleY);
        cs.stroke();

        return ruleY - LEADING;
    }

    private PDImageXObject loadLogo(PDDocument document) {
        try (InputStream in = getClass().getResourceAsStream(LOGO_RESOURCE)) {
            if (in == null) {
                log.warn("CAMTEL logo resource {} not found - report header will render without it", LOGO_RESOURCE);
                return null;
            }
            return PDImageXObject.createFromByteArray(document, in.readAllBytes(), "camtel-logo");
        } catch (IOException e) {
            log.warn("Could not load CAMTEL logo for PDF report header", e);
            return null;
        }
    }

    @Override
    public List<ReportResponse> listForManager(Long managerId) {
        return reportRepository.findByGeneratedByIdOrderByGeneratedAtDesc(managerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Report getReportForDownload(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        if (report.getFilePath() == null) {
            throw new ReportNotReadyException(
                    "This report is still being generated. Try downloading it again shortly.");
        }

        return report;
    }

    private ReportType parseReportType(String raw) {
        try {
            return ReportType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid report type '" + raw + "'. Valid values: " + Arrays.toString(ReportType.values()));
        }
    }

    private ReportResponse toResponse(Report r) {
        return new ReportResponse(r.getId(), r.getType().name(), r.getStartDate(), r.getEndDate(),
                r.getGeneratedAt(), r.getFilePath());
    }
}