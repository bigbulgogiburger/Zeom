// Consultation immersive group — minimum-bleed wrapper.
// AppHeader/BottomTabBar self-hide on this path via pathname guard.
// review/ has its own layout that restores chrome surface.
export default function ConsultationSessionLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[hsl(var(--background))] text-[hsl(var(--text-primary))]">{children}</div>;
}
