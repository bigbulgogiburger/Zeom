package com.cheonjiyeon.api.counselor;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/counselor")
public class CounselorPortalController {
    private final CounselorPortalService portalService;

    public CounselorPortalController(CounselorPortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping("/me")
    public CounselorPortalDtos.CounselorProfileResponse getMe(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return portalService.getMe(authHeader);
    }

    @GetMapping("/bookings")
    public CounselorPortalDtos.CounselorBookingListResponse getBookings(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return portalService.getBookings(authHeader, date, status, page, size);
    }

    @GetMapping("/bookings/today")
    public List<CounselorPortalDtos.CounselorBookingItem> getTodayBookings(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return portalService.getTodayBookings(authHeader);
    }

    @GetMapping("/dashboard")
    public CounselorPortalDtos.DashboardResponse getDashboard(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return portalService.getDashboard(authHeader);
    }

    @GetMapping("/customers")
    public CounselorPortalDtos.CustomerListResponse getCustomers(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return portalService.getCustomers(authHeader);
    }

    @GetMapping("/settlement")
    public CounselorPortalDtos.SettlementListResponse getSettlement(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return portalService.getSettlement(authHeader, page, size);
    }

    @PostMapping("/settlement/request")
    public CounselorPortalDtos.SettlementRequestResponse requestSettlement(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return portalService.requestSettlement(authHeader);
    }

    @GetMapping("/records")
    public CounselorPortalDtos.ConsultationRecordListResponse getRecords(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return portalService.getRecords(authHeader, page, size);
    }

    @PostMapping("/records/{sessionId}/memo")
    public CounselorPortalDtos.MemoResponse saveMemo(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long sessionId,
            @Valid @RequestBody CounselorPortalDtos.SaveMemoRequest request) {
        return portalService.saveMemo(authHeader, sessionId, request.content());
    }

    @PostMapping("/memos")
    public CounselorPortalDtos.MemoResponse createMemo(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CounselorPortalDtos.SaveMemoRequest request) {
        return portalService.saveMemo(authHeader, request.sessionId(), request.content());
    }

    @GetMapping("/memos/{sessionId}")
    public CounselorPortalDtos.MemoResponse getMemo(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long sessionId) {
        return portalService.getMemo(authHeader, sessionId);
    }

    @GetMapping("/memos")
    public CounselorPortalDtos.MemoListResponse getMyMemos(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return portalService.getMyMemos(authHeader, page, size);
    }

    @DeleteMapping("/memos/{sessionId}")
    public void deleteMemo(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long sessionId) {
        portalService.deleteMemo(authHeader, sessionId);
    }

    @GetMapping("/customers/{userId}/sessions")
    public CounselorPortalDtos.CustomerSessionListResponse getCustomerSessions(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long userId) {
        return portalService.getCustomerSessions(authHeader, userId);
    }

    @GetMapping("/customers/{userId}/memos")
    public CounselorPortalDtos.CustomerMemoListResponse getCustomerMemos(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long userId) {
        return portalService.getCustomerMemos(authHeader, userId);
    }

    @PutMapping("/profile")
    public CounselorPortalDtos.CounselorProfileResponse updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CounselorPortalDtos.UpdateProfileRequest request) {
        return portalService.updateProfile(authHeader, request);
    }

    @PutMapping("/schedule")
    public CounselorPortalDtos.ScheduleResponse updateSchedule(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CounselorPortalDtos.UpdateScheduleRequest request) {
        return portalService.updateSchedule(authHeader, request);
    }

    @GetMapping("/reviews")
    public CounselorPortalDtos.CounselorReviewListResponse getReviews(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return portalService.getReviews(authHeader, page, size);
    }

    @PostMapping("/reviews/{id}/reply")
    public CounselorPortalDtos.ReviewReplyResponse replyToReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody CounselorPortalDtos.ReplyRequest request) {
        return portalService.replyToReview(authHeader, id, request.reply());
    }
}
