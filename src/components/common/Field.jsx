/**
 * Field — label + hint wrapper for form inputs.
 * Updated for nature light theme.
 */
export default function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      {label && (
        <div className="flex items-center gap-1.5 mb-1.75">
          <span className="text-[9px] tracking-[0.14em] text-[#2a6048] font-['Fraunces',serif] uppercase opacity-70">
            {label}
          </span>
          {hint && (
            <span className="text-[9.5px] text-[#8a8475] font-['JetBrains_Mono',monospace]">
              — {hint}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}