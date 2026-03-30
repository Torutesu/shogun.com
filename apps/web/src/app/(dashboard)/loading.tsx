export default function DashboardLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-light-border dark:border-dark-border border-t-gold" />
        <span className="text-sm text-light-text-muted dark:text-dark-text-muted">Loading...</span>
      </div>
    </div>
  );
}
