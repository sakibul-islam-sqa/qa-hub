import * as React from 'react';
import type { AiProviderId } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

/**
 * Provider logos. If a file is registered in LOGO_FILES, that image is loaded
 * from /public/logos/<file>. Otherwise the inline-SVG fallback below renders.
 *
 * To use a real image for a provider:
 *   1. Drop the file in `public/logos/`, e.g. `public/logos/openai.svg`
 *   2. Add or uncomment the matching entry in LOGO_FILES below.
 *
 * Any common web image format works: .svg, .png, .webp.
 *
 * Set `darkInvert: true` for monochrome marks whose dark pixels disappear on
 * the dark-mode surface tile (e.g. plain black logos on transparent bg).
 * Set `darkBg: true` for multi-color marks that include dark pixels we can't
 * invert without distorting the brand color — we paint a light backplate
 * behind the image only in dark mode.
 */
interface LogoFile {
  file: string;
  darkInvert?: boolean;
  darkBg?: boolean;
}
const LOGO_FILES: Partial<Record<AiProviderId, LogoFile>> = {
  anthropic: { file: 'claude.png' },
  cerebras: { file: 'cerebras.png', darkBg: true },
  groq: { file: 'groq.png' },
  mistral: { file: 'mistral.png' },
  ollama: { file: 'ollama.png', darkInvert: true },
  openrouter: { file: 'openrouter.png', darkInvert: true },
};

export function ProviderLogo({
  providerId,
  className,
}: {
  providerId: AiProviderId;
  className?: string;
}) {
  const cls = cn('h-5 w-5 shrink-0', className);
  const entry = LOGO_FILES[providerId];
  if (entry) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={`/logos/${entry.file}`}
        alt=""
        className={cn(
          cls,
          entry.darkInvert && 'dark:invert',
          entry.darkBg && 'dark:rounded-full dark:bg-white',
        )}
      />
    );
  }
  switch (providerId) {
    case 'openai':
      return <OpenAILogo className={cls} />;
    case 'anthropic':
      return <AnthropicLogo className={cls} />;
    case 'gemini':
      return <GeminiLogo className={cls} />;
    case 'groq':
      return <GroqLogo className={cls} />;
    case 'openrouter':
      return <OpenRouterLogo className={cls} />;
    case 'github':
      return <GitHubLogo className={cls} />;
    case 'mistral':
      return <MistralLogo className={cls} />;
    case 'cerebras':
      return <CerebrasLogo className={cls} />;
    case 'ollama':
      return <OllamaLogo className={cls} />;
    default: {
      // Exhaustiveness check — if a new AiProviderId is added without an SVG
      // fallback above (or a LOGO_FILES entry), TypeScript will fail here at
      // compile time. At runtime, fall back to a neutral monogram so we never
      // return `undefined` (which React would throw on).
      const _exhaustive: never = providerId;
      void _exhaustive;
      return <MonogramLogo className={cls} bg="#64748B" letters="?" />;
    }
  }
}

interface LogoProps {
  className?: string;
}

function OpenAILogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9 6.0651 6.0651 0 0 0-4.5995-2.0599 6.0529 6.0529 0 0 0-5.7717 4.1898 5.9847 5.9847 0 0 0-3.9979 2.9 6.0529 6.0529 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2056 5.9894 5.9894 0 0 0 3.9979-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826c-.0049 2.4774-2.013 4.4855-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502c-2.1499 1.2382-4.8945.5097-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654 2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997z"
      />
    </svg>
  );
}

function AnthropicLogo({ className }: LogoProps) {
  // Claude's hand-drawn sparkle: 11 irregular cream rays radiating from the
  // center on Anthropic's brand coral rounded square.
  const rays: Array<{ angle: number; len: number; w: number }> = [
    { angle: 0, len: 11, w: 0.9 },
    { angle: 33, len: 10.4, w: 1.0 },
    { angle: 62, len: 9.8, w: 0.85 },
    { angle: 92, len: 10.8, w: 1.0 },
    { angle: 122, len: 10.2, w: 0.9 },
    { angle: 156, len: 10.6, w: 1.05 },
    { angle: 188, len: 11, w: 0.9 },
    { angle: 215, len: 10.2, w: 1.0 },
    { angle: 245, len: 10.6, w: 0.85 },
    { angle: 280, len: 10.4, w: 1.05 },
    { angle: 325, len: 10.8, w: 0.95 },
  ];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#D97757" />
      <g fill="#F4EBE0">
        {rays.map((r, i) => {
          const tipY = (12 - r.len).toFixed(2);
          const midY = (12 - r.len * 0.42).toFixed(2);
          const left = (12 - r.w).toFixed(2);
          const right = (12 + r.w).toFixed(2);
          return (
            <path
              key={i}
              d={`M12 12 L${left} ${midY} L12 ${tipY} L${right} ${midY} Z`}
              transform={`rotate(${r.angle} 12 12)`}
            />
          );
        })}
      </g>
    </svg>
  );
}

function GeminiLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient
          id="gemini-grad"
          x1="0"
          y1="0"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#1C7EE7" />
          <stop offset="0.55" stopColor="#9168C0" />
          <stop offset="1" stopColor="#E33670" />
        </linearGradient>
      </defs>
      <path
        fill="url(#gemini-grad)"
        d="M12 24A14.304 14.304 0 0 0 0 12 14.304 14.304 0 0 0 12 0a14.305 14.305 0 0 0 12 12 14.305 14.305 0 0 0-12 12"
      />
    </svg>
  );
}

function GitHubLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  );
}

function MistralLogo({ className }: LogoProps) {
  // Mistral's pixel-band mark: yellow → amber → orange → red-orange → red,
  // with the brand's signature gaps (top short, mid full bar, bottom split).
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* Yellow band */}
      <rect x="3" y="0" width="5" height="4" fill="#FFD400" />
      <rect x="17" y="0" width="6" height="4" fill="#FFD400" />
      {/* Amber band */}
      <rect x="1" y="4" width="10" height="4" fill="#FFA60D" />
      <rect x="13" y="4" width="10" height="4" fill="#FFA60D" />
      {/* Bright orange - continuous bar */}
      <rect x="0" y="8" width="24" height="6" fill="#FF8205" />
      {/* Red-orange small pixels */}
      <rect x="1" y="14" width="4" height="4" fill="#FA5018" />
      <rect x="7" y="14" width="4" height="4" fill="#FA5018" />
      <rect x="13" y="14" width="4" height="4" fill="#FA5018" />
      <rect x="19" y="14" width="4" height="4" fill="#FA5018" />
      {/* Dark red base, split */}
      <rect x="0" y="18" width="10" height="6" fill="#E10500" />
      <rect x="12" y="18" width="12" height="6" fill="#E10500" />
    </svg>
  );
}

function OllamaLogo({ className }: LogoProps) {
  // Simplified llama silhouette.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M8.7 2.05c.51 0 .93.42.93.94v2.27c.55-.13 1.13-.2 1.72-.2h1.3c.59 0 1.17.07 1.72.2V2.99c0-.52.42-.94.93-.94.52 0 .94.42.94.94v3.07c1.66.79 2.94 2.23 3.5 4.02l.41-.16c.48-.18 1.01.07 1.19.55.18.48-.06 1.01-.54 1.19l-.59.22c.02.21.03.43.03.65v6.49a1.94 1.94 0 0 1-1.94 1.94H6.7a1.94 1.94 0 0 1-1.94-1.94v-6.49c0-.22.01-.44.03-.65l-.59-.22a.93.93 0 0 1-.54-1.19c.18-.48.71-.73 1.19-.55l.41.16a5.6 5.6 0 0 1 3.5-4.02V2.99c0-.52.42-.94.94-.94zm-1.27 9.18a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm9.14 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM10.5 16.2c0 .49.6.74 1.5.74s1.5-.25 1.5-.74c0-.34-.6-.45-1.5-.45s-1.5.11-1.5.45z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Monogram tiles - for brands whose primary mark is a wordmark.       */
/* ------------------------------------------------------------------ */

function MonogramLogo({
  className,
  bg,
  fg = '#ffffff',
  letters,
}: LogoProps & { bg: string; fg?: string; letters: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="5" fill={bg} />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize={letters.length === 1 ? 14 : 10}
        fill={fg}
      >
        {letters}
      </text>
    </svg>
  );
}

function GroqLogo({ className }: LogoProps) {
  return <MonogramLogo className={className} bg="#F55036" letters="G" />;
}

function OpenRouterLogo({ className }: LogoProps) {
  // Two arrows fanning out to the right from a shared left edge.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M0 6C9 6 14 2.7 17 2.5L17 0L24 5.5L17 11L17 8.5C14 8.7 9 11 0 11Z"
      />
      <path
        fill="currentColor"
        d="M0 13C9 13 14 15.3 17 15.5L17 13L24 18.5L17 24L17 21.5C14 21.3 9 18 0 18Z"
      />
    </svg>
  );
}

function CerebrasLogo({ className }: LogoProps) {
  return <MonogramLogo className={className} bg="#EF4444" letters="C" />;
}
