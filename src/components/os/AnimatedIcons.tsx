'use client';

import React from 'react';

export interface AnimatedAppIconProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * 21st.dev-inspired custom non-generic micro-animated SVG icon library crafted for Betterway Mortgages LLC.
 * Each icon pairs dual-tone precision geometry with subtle CSS keyframe & group-hover kinetic motion.
 */
export function AnimatedAppIcon({ name, size = 20, className = '' }: AnimatedAppIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `shrink-0 ${className}`,
    'aria-hidden': true,
  };

  switch (name) {
    case 'apps':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="2" className="bw-ico-lift-hover" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2" fill="currentColor" fillOpacity="0.18" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2" fill="currentColor" fillOpacity="0.18" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2" className="bw-ico-gleam" />
        </svg>
      );

    case 'place':
      return (
        <svg {...common}>
          <path d="M3.5 17.5h17l-1.5-9-4.5 3.5L12 5.5 9.5 12 5 8.5l-1.5 9Z" fill="currentColor" fillOpacity="0.18" className="bw-ico-lift-hover" />
          <circle cx="12" cy="4.2" r="1.15" fill="#FBE8A4" stroke="none" className="bw-ico-gleam" />
          <path d="M5 20.2h14" />
        </svg>
      );

    case 'corner':
    case 'vault':
      return (
        <svg {...common}>
          <path d="M7.5 11V7.8a4.5 4.5 0 0 1 9 0V11" className="bw-ico-lift-hover" />
          <rect x="4.5" y="11" width="15" height="9.5" rx="3" fill="currentColor" fillOpacity="0.16" />
          <circle cx="12" cy="15.5" r="1.4" fill="#34F0BC" stroke="none" className="bw-ico-gleam" />
          <path d="M12 16.8v1.5" stroke="#34F0BC" />
        </svg>
      );

    case 'command':
    case 'command-center':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" strokeOpacity="0.35" />
          <circle cx="12" cy="12" r="4.8" strokeOpacity="0.55" />
          <g className="bw-ico-radar">
            <path d="M12 12L18.2 5.8" stroke="#34F0BC" strokeWidth="2.1" />
          </g>
          <circle cx="12" cy="12" r="1.7" fill="#FBE8A4" stroke="none" />
        </svg>
      );

    case 'dashboard':
      return (
        <svg {...common}>
          <path d="M3.5 19.5h17" strokeOpacity="0.55" />
          <rect x="4.8" y="11" width="3.2" height="8" rx="1.2" fill="currentColor" fillOpacity="0.28" className="bw-ico-bar-1" />
          <rect x="10.4" y="6.2" width="3.2" height="12.8" rx="1.2" fill="#34F0BC" fillOpacity="0.45" className="bw-ico-bar-2" />
          <rect x="16" y="8.8" width="3.2" height="10.2" rx="1.2" fill="#FBE8A4" fillOpacity="0.45" className="bw-ico-bar-3" />
        </svg>
      );

    case 'master':
    case 'master-log':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6.2" rx="7.5" ry="2.8" fill="currentColor" fillOpacity="0.2" className="bw-ico-lift-hover" />
          <path d="M4.5 6.2v5.4c0 1.55 3.35 2.8 7.5 2.8s7.5-1.25 7.5-2.8V6.2" />
          <path d="M4.5 11.6v5.8c0 1.55 3.35 2.8 7.5 2.8s7.5-1.25 7.5-2.8v-5.8" />
          <circle cx="16.5" cy="14.2" r="1" fill="#34F0BC" stroke="none" className="bw-ico-gleam" />
        </svg>
      );

    case 'pipeline':
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="4.4" height="15" rx="1.5" fill="currentColor" fillOpacity="0.16" />
          <rect x="9.8" y="4.5" width="4.4" height="10.5" rx="1.5" fill="#34F0BC" fillOpacity="0.32" className="bw-ico-lift-hover" />
          <rect x="16.1" y="4.5" width="4.4" height="13" rx="1.5" fill="#FBE8A4" fillOpacity="0.32" className="bw-ico-gleam" />
        </svg>
      );

    case 'coordinator':
      return (
        <svg {...common}>
          <rect x="5" y="4.5" width="14" height="16" rx="2.5" fill="currentColor" fillOpacity="0.14" />
          <path d="M9 3.5h6a1 1 0 0 1 1 1v1.5H8V4.5a1 1 0 0 1 1-1Z" fill="currentColor" fillOpacity="0.28" />
          <path d="M8.5 12l2.1 2.1 4.8-4.8" stroke="#34F0BC" strokeWidth="2.1" className="bw-ico-lift-hover" />
          <path d="M8.5 17h7" strokeOpacity="0.6" />
        </svg>
      );

    case 'crm':
      return (
        <svg {...common}>
          <circle cx="9.2" cy="8.2" r="3.2" fill="currentColor" fillOpacity="0.2" />
          <path d="M3.5 19c.6-3.2 2.9-5 5.7-5s5.1 1.8 5.7 5" />
          <circle cx="17.5" cy="9" r="2.2" strokeOpacity="0.7" />
          <path d="M17.5 14.5v4.2M15.4 16.6h4.2" stroke="#34F0BC" strokeWidth="2" className="bw-ico-gleam" />
        </svg>
      );

    case 'desk':
    case 'mortgage-desk':
      return (
        <svg {...common}>
          <path d="M3.5 9.5L12 4l8.5 5.5H3.5Z" fill="currentColor" fillOpacity="0.22" className="bw-ico-lift-hover" />
          <path d="M6 10v7.5M10 10v7.5M14 10v7.5M18 10v7.5" />
          <path d="M3.5 19.5h17" stroke="#FBE8A4" strokeWidth="2.1" />
        </svg>
      );

    case 'calculators':
      return (
        <svg {...common}>
          <rect x="4.5" y="3" width="15" height="18" rx="3" fill="currentColor" fillOpacity="0.14" />
          <rect x="7.5" y="6" width="9" height="3.2" rx="1" fill="#34F0BC" fillOpacity="0.45" className="bw-ico-gleam" />
          <circle cx="8.5" cy="12.8" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12.8" r="1" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="12.8" r="1" fill="#FBE8A4" stroke="none" className="bw-ico-dot-1" />
          <circle cx="8.5" cy="16.6" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="16.6" r="1" fill="currentColor" stroke="none" />
          <rect x="14.5" y="15.6" width="2.4" height="2" rx="0.6" fill="#34F0BC" stroke="none" className="bw-ico-dot-2" />
        </svg>
      );

    case 'sales':
      return (
        <svg {...common}>
          <rect x="3.5" y="7.5" width="17" height="12.5" rx="2.8" fill="currentColor" fillOpacity="0.16" className="bw-ico-tilt-hover" />
          <path d="M8.5 7.5V5.8a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.7" />
          <path d="M3.5 12.8h17" strokeOpacity="0.55" />
          <rect x="10.2" y="11.2" width="3.6" height="3" rx="0.8" fill="#FBE8A4" stroke="none" className="bw-ico-gleam" />
        </svg>
      );

    case 'accounts':
      return (
        <svg {...common}>
          <rect x="3.5" y="6" width="17" height="13" rx="3" fill="currentColor" fillOpacity="0.16" />
          <path d="M15.5 11.2h5v3.6h-5a1.8 1.8 0 0 1 0-3.6Z" fill="#FBE8A4" fillOpacity="0.35" className="bw-ico-gleam" />
          <circle cx="16.5" cy="13" r="0.9" fill="#FBE8A4" stroke="none" />
          <path d="M6.5 6V4.5a1.5 1.5 0 0 1 1.5-1.5h7.5" strokeOpacity="0.6" />
        </svg>
      );

    case 'compliance':
      return (
        <svg {...common}>
          <path d="M12 3.2l7.5 3.1v5.3c0 4.6-3.1 8-7.5 9.4-4.4-1.4-7.5-4.8-7.5-9.4V6.3L12 3.2Z" fill="currentColor" fillOpacity="0.16" />
          <path d="M8.8 12.1l2.2 2.3 4.5-4.6" stroke="#34F0BC" strokeWidth="2.1" className="bw-ico-lift-hover" />
        </svg>
      );

    case 'website':
    case 'website-studio':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.12" />
          <ellipse cx="12" cy="12" rx="3.8" ry="8.5" className="bw-ico-spin-hover" />
          <path d="M3.8 9.2h16.4M3.8 14.8h16.4" strokeOpacity="0.6" />
          <circle cx="18.2" cy="6.2" r="1.5" fill="#34F0BC" stroke="none" className="bw-ico-gleam" />
        </svg>
      );

    case 'employees':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6" height="6" rx="1.2" />
          <rect x="14" y="4" width="6" height="6" rx="1.2" />
          <rect x="4" y="14" width="6" height="6" rx="1.2" />
          <path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5z" fill="currentColor" stroke="none" />
          <line x1="3" y1="12" x2="21" y2="12" stroke="#34F0BC" strokeWidth="2" className="bw-ico-scan" />
        </svg>
      );

    case 'inside':
      return (
        <svg {...common}>
          <path d="M4.5 6.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H10l-4.5 3.5v-3.5H7.5a3 3 0 0 1-3-3v-7Z" fill="currentColor" fillOpacity="0.18" />
          <circle cx="9.2" cy="10" r="1.25" fill="#34F0BC" stroke="none" className="bw-ico-dot-1" />
          <circle cx="12.2" cy="10" r="1.25" fill="#FBE8A4" stroke="none" className="bw-ico-dot-2" />
          <circle cx="15.2" cy="10" r="1.25" fill="#34F0BC" stroke="none" className="bw-ico-dot-3" />
        </svg>
      );

    case 'sip-calls':
      return (
        <svg {...common}>
          <path
            d="M6.4 4.8h3l1.4 3.7-1.9 1.3a10.2 10.2 0 0 0 5.3 5.3l1.3-1.9 3.7 1.4v3a1.8 1.8 0 0 1-1.9 1.8C10.5 19 5 13.5 4.6 6.7a1.8 1.8 0 0 1 1.8-1.9Z"
            fill="currentColor"
            fillOpacity="0.2"
            className="bw-ico-tilt-hover"
          />
          <path d="M14.2 5.4a4.6 4.6 0 0 1 4.4 4.4" stroke="#34F0BC" className="bw-ico-gleam" />
          <path d="M14.2 2.8a7.4 7.4 0 0 1 7 7" stroke="#FBE8A4" className="bw-ico-wave" />
        </svg>
      );

    case 'gps':
    case 'field-gps':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="19.5" rx="6" ry="1.8" stroke="#34F0BC" strokeOpacity="0.55" className="bw-ico-wave" />
          <g className="bw-ico-pin">
            <path d="M12 3.5a5.5 5.5 0 0 1 5.5 5.5c0 4.2-5.5 9.2-5.5 9.2S6.5 13.2 6.5 9A5.5 5.5 0 0 1 12 3.5Z" fill="currentColor" fillOpacity="0.2" />
            <circle cx="12" cy="9" r="2" fill="#FBE8A4" stroke="none" />
          </g>
        </svg>
      );

    case 'ai':
      return (
        <svg {...common}>
          <path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h5v16H7a2.5 2.5 0 0 0-2.5 2.5V5.5Z" fill="currentColor" fillOpacity="0.16" />
          <path d="M19.5 5.5A2.5 2.5 0 0 0 17 3h-5v16h5a2.5 2.5 0 0 1 2.5 2.5V5.5Z" fill="currentColor" fillOpacity="0.22" className="bw-ico-lift-hover" />
          <path d="M14.8 3v5.4l1.4-1.1 1.4 1.1V3" fill="#FBE8A4" stroke="#FBE8A4" strokeWidth="1.2" className="bw-ico-gleam" />
        </svg>
      );

    case 'utilities':
      return (
        <svg {...common}>
          <g className="bw-ico-spin-hover">
            <circle cx="12" cy="12" r="3.2" fill="#FBE8A4" fillOpacity="0.35" />
            <path d="M12 3.2v2.4M12 18.4v2.4M3.2 12h2.4M18.4 12h2.4M5.8 5.8l1.7 1.7M16.5 16.5l1.7 1.7M18.2 5.8l-1.7 1.7M7.5 16.5l-1.7 1.7" />
          </g>
        </svg>
      );

    case 'settings':
    default:
      return (
        <svg {...common}>
          <g className="bw-ico-spin-hover">
            <circle cx="12" cy="12" r="3.4" />
            <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 .9-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5.9H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z" />
          </g>
        </svg>
      );
  }
}
