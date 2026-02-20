package com.cheonjiyeon.api.notification;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class EmailTemplateService {

    private static final String BRAND_NAME = "천지연꽃신당";
    private static final String GOLD = "#C9A227";
    private static final String BG_DARK = "#0f0d0a";
    private static final String CARD_BG = "#f9f5ed";
    private static final String TEXT_DARK = "#2d2419";
    private static final String TEXT_MUTED = "#6b5c4d";

    public String render(NotificationType type, Map<String, Object> data) {
        return switch (type) {
            case BOOKING_CONFIRMED -> bookingConfirmed(data);
            case CONSULTATION_REMINDER -> consultationReminder(data);
            case CONSULTATION_COMPLETED -> consultationCompleted(data);
            case REFUND_REQUESTED -> refundRequested(data);
            case REFUND_PROCESSED -> refundProcessed(data);
            case SETTLEMENT_PAID -> settlementPaid(data);
            case REVIEW_RECEIVED -> reviewReceived(data);
            case NEW_BOOKING -> newBooking(data);
        };
    }

    public String subject(NotificationType type) {
        return switch (type) {
            case BOOKING_CONFIRMED -> "[" + BRAND_NAME + "] 예약이 확정되었습니다";
            case CONSULTATION_REMINDER -> "[" + BRAND_NAME + "] 상담 시작 알림";
            case CONSULTATION_COMPLETED -> "[" + BRAND_NAME + "] 상담이 완료되었습니다";
            case REFUND_REQUESTED -> "[" + BRAND_NAME + "] 환불 요청이 접수되었습니다";
            case REFUND_PROCESSED -> "[" + BRAND_NAME + "] 환불이 처리되었습니다";
            case SETTLEMENT_PAID -> "[" + BRAND_NAME + "] 정산이 완료되었습니다";
            case REVIEW_RECEIVED -> "[" + BRAND_NAME + "] 새 리뷰가 등록되었습니다";
            case NEW_BOOKING -> "[" + BRAND_NAME + "] 새 예약이 접수되었습니다";
        };
    }

    private String bookingConfirmed(Map<String, Object> data) {
        String counselorName = getStr(data, "counselorName", "상담사");
        String dateTime = getStr(data, "dateTime", "");
        return wrapLayout(
                "예약 확정",
                "<p style='font-size:16px;color:" + TEXT_DARK + ";margin:0 0 16px;'>예약이 성공적으로 확정되었습니다.</p>" +
                "<table style='width:100%;border-collapse:collapse;margin-bottom:16px;'>" +
                "<tr><td style='padding:8px 0;color:" + TEXT_MUTED + ";width:80px;'>상담사</td><td style='padding:8px 0;color:" + TEXT_DARK + ";font-weight:bold;'>" + counselorName + "</td></tr>" +
                "<tr><td style='padding:8px 0;color:" + TEXT_MUTED + ";'>일시</td><td style='padding:8px 0;color:" + TEXT_DARK + ";font-weight:bold;'>" + dateTime + "</td></tr>" +
                "</table>" +
                "<p style='font-size:14px;color:" + TEXT_MUTED + ";margin:0;'>상담 시간 전에 알림을 보내드리겠습니다.</p>"
        );
    }

    private String consultationReminder(Map<String, Object> data) {
        String counselorName = getStr(data, "counselorName", "상담사");
        String minutesBefore = getStr(data, "minutesBefore", "");
        return wrapLayout(
                "상담 시작 알림",
                "<p style='font-size:16px;color:" + TEXT_DARK + ";margin:0 0 16px;'>상담 시작 " + minutesBefore + "분 전입니다.</p>" +
                "<p style='font-size:15px;color:" + TEXT_DARK + ";margin:0 0 8px;'>상담사: <strong>" + counselorName + "</strong></p>" +
                "<p style='font-size:14px;color:" + TEXT_MUTED + ";margin:0;'>미리 상담 준비를 해주세요.</p>"
        );
    }

    private String consultationCompleted(Map<String, Object> data) {
        String counselorName = getStr(data, "counselorName", "상담사");
        String duration = getStr(data, "duration", "");
        return wrapLayout(
                "상담 완료",
                "<p style='font-size:16px;color:" + TEXT_DARK + ";margin:0 0 16px;'>상담이 완료되었습니다.</p>" +
                "<table style='width:100%;border-collapse:collapse;margin-bottom:16px;'>" +
                "<tr><td style='padding:8px 0;color:" + TEXT_MUTED + ";width:80px;'>상담사</td><td style='padding:8px 0;color:" + TEXT_DARK + ";font-weight:bold;'>" + counselorName + "</td></tr>" +
                (duration.isEmpty() ? "" : "<tr><td style='padding:8px 0;color:" + TEXT_MUTED + ";'>상담시간</td><td style='padding:8px 0;color:" + TEXT_DARK + ";font-weight:bold;'>" + duration + "분</td></tr>") +
                "</table>" +
                "<p style='font-size:14px;color:" + TEXT_MUTED + ";margin:0;'>소중한 리뷰를 남겨주시면 상담사에게 큰 힘이 됩니다.</p>"
        );
    }

    private String refundRequested(Map<String, Object> data) {
        String amount = getStr(data, "amount", "");
        return wrapLayout(
                "환불 요청 접수",
                "<p style='font-size:16px;color:" + TEXT_DARK + ";margin:0 0 16px;'>환불 요청이 접수되었습니다.</p>" +
                (amount.isEmpty() ? "" : "<p style='font-size:15px;color:" + TEXT_DARK + ";margin:0 0 8px;'>환불 금액: <strong>" + amount + "원</strong></p>") +
                "<p style='font-size:14px;color:" + TEXT_MUTED + ";margin:0;'>검토 후 결과를 알려드리겠습니다.</p>"
        );
    }

    private String refundProcessed(Map<String, Object> data) {
        String amount = getStr(data, "amount", "");
        String result = getStr(data, "result", "처리됨");
        return wrapLayout(
                "환불 처리 완료",
                "<p style='font-size:16px;color:" + TEXT_DARK + ";margin:0 0 16px;'>환불이 " + result + ".</p>" +
                (amount.isEmpty() ? "" : "<p style='font-size:15px;color:" + TEXT_DARK + ";margin:0 0 8px;'>환불 금액: <strong>" + amount + "원</strong></p>") +
                "<p style='font-size:14px;color:" + TEXT_MUTED + ";margin:0;'>자세한 내용은 마이페이지에서 확인하세요.</p>"
        );
    }

    private String settlementPaid(Map<String, Object> data) {
        String amount = getStr(data, "amount", "");
        String period = getStr(data, "period", "");
        return wrapLayout(
                "정산 완료",
                "<p style='font-size:16px;color:" + TEXT_DARK + ";margin:0 0 16px;'>정산이 완료되었습니다.</p>" +
                "<table style='width:100%;border-collapse:collapse;margin-bottom:16px;'>" +
                (amount.isEmpty() ? "" : "<tr><td style='padding:8px 0;color:" + TEXT_MUTED + ";width:80px;'>정산금액</td><td style='padding:8px 0;color:" + TEXT_DARK + ";font-weight:bold;'>" + amount + "원</td></tr>") +
                (period.isEmpty() ? "" : "<tr><td style='padding:8px 0;color:" + TEXT_MUTED + ";'>정산기간</td><td style='padding:8px 0;color:" + TEXT_DARK + ";font-weight:bold;'>" + period + "</td></tr>") +
                "</table>" +
                "<p style='font-size:14px;color:" + TEXT_MUTED + ";margin:0;'>등록된 계좌로 입금될 예정입니다.</p>"
        );
    }

    private String reviewReceived(Map<String, Object> data) {
        String customerName = getStr(data, "customerName", "고객");
        String rating = getStr(data, "rating", "");
        return wrapLayout(
                "새 리뷰",
                "<p style='font-size:16px;color:" + TEXT_DARK + ";margin:0 0 16px;'>새 리뷰가 등록되었습니다.</p>" +
                "<p style='font-size:15px;color:" + TEXT_DARK + ";margin:0 0 8px;'>작성자: <strong>" + customerName + "</strong></p>" +
                (rating.isEmpty() ? "" : "<p style='font-size:15px;color:" + GOLD + ";margin:0 0 8px;'>평점: " + rating + "점</p>") +
                "<p style='font-size:14px;color:" + TEXT_MUTED + ";margin:0;'>리뷰 내용을 확인해보세요.</p>"
        );
    }

    private String newBooking(Map<String, Object> data) {
        String customerName = getStr(data, "customerName", "고객");
        String dateTime = getStr(data, "dateTime", "");
        return wrapLayout(
                "새 예약",
                "<p style='font-size:16px;color:" + TEXT_DARK + ";margin:0 0 16px;'>새 예약이 접수되었습니다.</p>" +
                "<table style='width:100%;border-collapse:collapse;margin-bottom:16px;'>" +
                "<tr><td style='padding:8px 0;color:" + TEXT_MUTED + ";width:80px;'>고객명</td><td style='padding:8px 0;color:" + TEXT_DARK + ";font-weight:bold;'>" + customerName + "</td></tr>" +
                (dateTime.isEmpty() ? "" : "<tr><td style='padding:8px 0;color:" + TEXT_MUTED + ";'>일시</td><td style='padding:8px 0;color:" + TEXT_DARK + ";font-weight:bold;'>" + dateTime + "</td></tr>") +
                "</table>" +
                "<p style='font-size:14px;color:" + TEXT_MUTED + ";margin:0;'>예약 상세를 확인해주세요.</p>"
        );
    }

    private String wrapLayout(String heading, String content) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body style='margin:0;padding:0;background:" + BG_DARK + ";font-family:\"Noto Sans KR\",sans-serif;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='background:" + BG_DARK + ";padding:40px 20px;'><tr><td align='center'>" +
                "<table width='560' cellpadding='0' cellspacing='0' style='max-width:560px;width:100%;'>" +
                // Header
                "<tr><td style='padding:24px 32px;text-align:center;'>" +
                "<span style='font-size:20px;font-weight:900;color:" + GOLD + ";letter-spacing:-0.5px;'>" + BRAND_NAME + "</span>" +
                "</td></tr>" +
                // Card
                "<tr><td style='background:" + CARD_BG + ";border-radius:16px;padding:32px;'>" +
                "<h2 style='margin:0 0 20px;font-size:20px;color:" + TEXT_DARK + ";font-weight:700;'>" + heading + "</h2>" +
                content +
                "</td></tr>" +
                // Footer
                "<tr><td style='padding:24px 32px;text-align:center;'>" +
                "<p style='font-size:12px;color:#6b5c4d;margin:0;'>" + BRAND_NAME + " | 문의: support@cheonjiyeon.com</p>" +
                "</td></tr>" +
                "</table></td></tr></table></body></html>";
    }

    private String getStr(Map<String, Object> data, String key, String defaultValue) {
        if (data == null) return defaultValue;
        Object val = data.get(key);
        return val != null ? val.toString() : defaultValue;
    }
}
