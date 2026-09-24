export function FormMessage({
  children,
  kind = 'error',
}: {
  children: string;
  kind?: 'error' | 'success';
}) {
  return (
    <p
      className={kind === 'error' ? 'form-error' : 'form-success'}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}
