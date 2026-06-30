import React from "react";

export function EmptyPendingIllustration() {
  return (
    <div className="w-40 h-40 mx-auto mb-4 relative flex items-center justify-center animate-fade-in" id="svg-empty-pending">
      {/* Decorative ambient glowing backdrops */}
      <div className="absolute inset-0 bg-emerald-400/5 dark:bg-emerald-400/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-xl" />

      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative drop-shadow-sm"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="20" y1="20" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" /> {/* emerald-500 */}
            <stop offset="100%" stopColor="#6366f1" /> {/* indigo-500 */}
          </linearGradient>
          <linearGradient id="glowGrad" x1="40" y1="40" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Orbital rings */}
        <circle cx="70" cy="70" r="54" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" className="text-slate-200 dark:text-slate-800" />
        <circle cx="70" cy="70" r="42" stroke="currentColor" strokeWidth="1" className="text-slate-100 dark:text-slate-850" />

        {/* Outer shield structure */}
        <path
          d="M70 24C85 24 98 28 106 35C106 70 95 95 70 114C45 95 34 70 34 35C42 28 55 24 70 24Z"
          fill="url(#glowGrad)"
          fillOpacity="0.1"
          stroke="url(#shieldGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Floating elements inside orbital ring */}
        <circle cx="28" cy="48" r="3" className="fill-emerald-400 animate-bounce" style={{ animationDelay: "0.2s", animationDuration: "3s" }} />
        <circle cx="112" cy="54" r="2.5" className="fill-indigo-400 animate-bounce" style={{ animationDelay: "0.6s", animationDuration: "2.5s" }} />
        <circle cx="85" cy="118" r="4" className="fill-slate-200 dark:fill-slate-800 animate-pulse" />
        
        {/* Glowing Success Sparkles */}
        <path d="M42 90 L45 95 L50 96 L45 97 L42 102 L39 97 L34 96 L39 95 Z" className="fill-emerald-300 dark:fill-emerald-500/80 animate-pulse" />
        <path d="M102 30 L104 33 L107 34 L104 35 L102 38 L100 35 L97 34 L100 33 Z" className="fill-indigo-300 dark:fill-indigo-500/80 animate-pulse" />

        {/* Center checkmark emblem with background circle */}
        <circle cx="70" cy="68" r="18" className="fill-white dark:fill-slate-900 stroke-slate-100 dark:stroke-slate-800" strokeWidth="1.5" />
        <path
          d="M62 68L67 73L78 62"
          stroke="url(#shieldGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}

export function EmptyCompletedIllustration() {
  return (
    <div className="w-40 h-40 mx-auto mb-4 relative flex items-center justify-center animate-fade-in" id="svg-empty-completed">
      {/* Decorative ambient glowing backdrops */}
      <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute w-24 h-24 bg-slate-200/20 dark:bg-slate-850/30 rounded-full blur-xl" />

      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative drop-shadow-sm"
      >
        <defs>
          <linearGradient id="vaultGrad" x1="30" y1="30" x2="110" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" /> {/* indigo-500 */}
            <stop offset="100%" stopColor="#4f46e5" /> {/* indigo-600 */}
          </linearGradient>
        </defs>

        {/* Grid dots backdrop */}
        <circle cx="35" cy="35" r="1.5" className="fill-slate-200 dark:fill-slate-800" />
        <circle cx="70" cy="35" r="1.5" className="fill-slate-200 dark:fill-slate-800" />
        <circle cx="105" cy="35" r="1.5" className="fill-slate-200 dark:fill-slate-800" />
        <circle cx="35" cy="70" r="1.5" className="fill-slate-200 dark:fill-slate-800" />
        <circle cx="105" cy="70" r="1.5" className="fill-slate-200 dark:fill-slate-800" />
        <circle cx="35" cy="105" r="1.5" className="fill-slate-200 dark:fill-slate-800" />
        <circle cx="70" cy="105" r="1.5" className="fill-slate-200 dark:fill-slate-800" />
        <circle cx="105" cy="105" r="1.5" className="fill-slate-200 dark:fill-slate-800" />

        {/* Circular dial outline */}
        <circle cx="70" cy="70" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-slate-200 dark:text-slate-800" />

        {/* Vault / Archive Box Line Art */}
        <rect x="42" y="50" width="56" height="42" rx="6" stroke="url(#vaultGrad)" strokeWidth="2" strokeLinejoin="round" className="fill-white dark:fill-slate-900" />
        <path d="M42 62H98" stroke="url(#vaultGrad)" strokeWidth="2" strokeLinecap="round" />
        
        {/* Drawer Pull handle */}
        <path d="M62 72H78" stroke="url(#vaultGrad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M66 72C66 75.5 74 75.5 74 72" stroke="url(#vaultGrad)" strokeWidth="2" strokeLinecap="round" />

        {/* Safe Lock Ring */}
        <circle cx="70" cy="40" r="10" className="fill-slate-50 dark:fill-slate-850 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
        <line x1="70" y1="34" x2="70" y2="36" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 dark:text-slate-500" />
        <line x1="76" y1="40" x2="74" y2="40" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 dark:text-slate-500" />
        <line x1="70" y1="46" x2="70" y2="44" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 dark:text-slate-500" />
        <line x1="64" y1="40" x2="66" y2="40" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 dark:text-slate-500" />

        {/* Floating trophy silhouette/badge above box */}
        <path d="M64 24H76M66 24V28C66 31 74 31 74 28V24M70 29V32" stroke="currentColor" strokeWidth="1.5" className="text-amber-400 dark:text-amber-500/85" strokeLinecap="round" />

        {/* Sparkles */}
        <circle cx="108" cy="48" r="2" className="fill-indigo-300 animate-pulse" />
        <circle cx="30" cy="80" r="1.5" className="fill-slate-350 dark:fill-slate-600 animate-pulse" />
      </svg>
    </div>
  );
}

export function EmptySearchIllustration() {
  return (
    <div className="w-40 h-40 mx-auto mb-4 relative flex items-center justify-center animate-fade-in" id="svg-empty-search">
      {/* Decorative ambient glowing backdrops */}
      <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />

      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative"
      >
        <defs>
          <linearGradient id="searchGrad" x1="40" y1="40" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" /> {/* indigo-400 */}
            <stop offset="100%" stopColor="#4f46e5" /> {/* indigo-600 */}
          </linearGradient>
        </defs>

        {/* Magnifying glass path centered */}
        <circle cx="65" cy="65" r="22" stroke="url(#searchGrad)" strokeWidth="2.5" className="fill-white dark:fill-slate-900" />
        <path d="M81 81L102 102" stroke="url(#searchGrad)" strokeWidth="3" strokeLinecap="round" />

        {/* Empty lines/dashed guidelines representing scanned data */}
        <path d="M40 35H100" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" />
        <path d="M40 105H100" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" />
        
        {/* Focus lines framing the magnifying glass */}
        <path d="M30 55H38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-300 dark:text-slate-750" />
        <path d="M102 55H110" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-300 dark:text-slate-750" />
        <path d="M30 75H38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-300 dark:text-slate-750" />
        <path d="M102 75H110" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-300 dark:text-slate-750" />

        {/* Floating cross icon as empty result indicator */}
        <path d="M61 61L69 69M69 61L61 69" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-300 dark:text-slate-600" />
      </svg>
    </div>
  );
}
