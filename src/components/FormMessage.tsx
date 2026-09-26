export function FormMessage({
  children,
  kind = 'error',
}: {
  children: string;
  kind?: 'error' | 'success';
}) {
  return (
    <p
      className={
        kind === 'error'
          ? 'rounded-lg border border-status-danger/25 bg-status-danger/10 px-4 py-3 text-[0.9rem] text-status-danger'
          : 'rounded-lg border border-status-success/25 bg-status-success/10 px-4 py-3 text-[0.9rem] text-status-success'
      }
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}
