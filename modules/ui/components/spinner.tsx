// Small rotating ring for buttons while their action runs. Inherits the text color.

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={`${className} shrink-0 motion-safe:animate-spin`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Button content that swaps to a spinner + pending text while the action runs:
 * <button disabled={pending}><ButtonLabel pending={pending} pendingText="Saving…">Save</ButtonLabel></button>
 */
export function ButtonLabel({
  pending,
  pendingText,
  children,
}: {
  pending: boolean;
  pendingText?: string;
  children: React.ReactNode;
}) {
  if (!pending) return <>{children}</>;
  return (
    <>
      <Spinner />
      <span>{pendingText ?? children}</span>
    </>
  );
}
