/**
 * Field — premium labelled form field wrapper.
 * Props unchanged.
 */

export default function Field({ label, hint, children }) {
  return (
    <div className="mb-4.5">
      <div className="text-[9.5px] font-semibold tracking-[0.18em] text-[rgba(200,168,74,0.7)] font-['Cinzel',serif] mb-2 uppercase flex items-center gap-1.5">
        {label}
        {hint && (
          <span className="text-[#7a7060] font-normal text-[9px] tracking-[0.04em] font-['DM_Sans',sans-serif] normal-case">
            ({hint})
          </span>
        )}
      </div>
      {children}
    </div>
  );
}