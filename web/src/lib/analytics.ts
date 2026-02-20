declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function isEnabled(): boolean {
  return typeof window !== 'undefined' && !!GA_ID && !!window.gtag;
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!isEnabled()) return;
  window.gtag!('event', eventName, params);
}

export function trackSignUp() {
  trackEvent('sign_up', { method: 'email' });
}

export function trackLogin() {
  trackEvent('login', { method: 'email' });
}

export function trackViewCounselor(counselorId: number | string) {
  trackEvent('view_counselor', { counselor_id: counselorId });
}

export function trackBeginBooking(bookingId: number | string) {
  trackEvent('begin_booking', { booking_id: bookingId });
}

export function trackPurchase(amount: number) {
  trackEvent('purchase', { value: amount, currency: 'KRW' });
}

export function trackBeginConsultation(sessionId: number | string) {
  trackEvent('begin_consultation', { session_id: sessionId });
}

export function trackSubmitReview(reviewId: number | string) {
  trackEvent('submit_review', { review_id: reviewId });
}

export function trackRefundRequest(refundId: number | string) {
  trackEvent('refund_request', { refund_id: refundId });
}
