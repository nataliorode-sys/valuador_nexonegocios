// Logo NexoNegocios: marca "N" (SVG) + wordmark. Variantes para fondo claro/oscuro.
export default function Logo({
  variant = "light",
  className = "",
  showWord = true,
}: {
  variant?: "light" | "dark";
  className?: string;
  showWord?: boolean;
}) {
  const word = variant === "dark" ? "#ffffff" : "#132033";
  const ghost = variant === "dark" ? "rgba(255,255,255,0.22)" : "#DFE6EC";
  return (
    <span className={`inline-flex items-center gap-2 leading-none ${className}`}>
      <svg viewBox="0 0 62 60" style={{ width: "1.5em", height: "1.5em" }} aria-hidden fill="none">
        <path d="M23 50 L23 16 L51 46 L51 13" stroke={ghost} strokeWidth={10.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 50 L16 16 L44 46 L44 13" stroke="#45B649" strokeWidth={10.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showWord && (
        <span className="font-extrabold tracking-tight" style={{ letterSpacing: "-0.01em" }}>
          <span style={{ color: "#45B649" }}>Nexo</span>
          <span style={{ color: word }}>Negocios</span>
        </span>
      )}
    </span>
  );
}
