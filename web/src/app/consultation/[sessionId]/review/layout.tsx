// Review surface keeps the global chrome (AppHeader/BottomTabBar) — pathname guard
// in those components skips the immersive removal because seg[3] === 'review'.
// This layout exists only to satisfy the layout-group contract.
export default function ConsultationReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
