const paths = {
  bank: <><path d="m3 9 9-6 9 6" /><path d="M4 10h16M5 10v9m4-9v9m6-9v9m4-9v9M3 21h18" /></>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
  building: <><path d="M4 21V5l8-3 8 3v16M2 21h20" /><path d="M8 8h1m6 0h1M8 12h1m6 0h1M10 21v-5h4v5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M3 10h18M6 15h5" /></>,
  chair: <><path d="M7 11V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6M5 11h14v4H5zM7 15v6m10-6v6M5 21h14" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  clipboard: <><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 4.5h6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1ZM9 11h6m-6 4h6m-6 4h4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  eyeOff: <><path d="m3 3 18 18M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.2 6.8C3.5 8.5 2 12 2 12s3.5 6 10 6c1.3 0 2.4-.2 3.5-.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  film: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M3 11h18M7 7l2-4m5 4 2-4m-2 8v2m-5-2v2m10-2v2" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  masks: <><path d="M3 6c3-2 6-2 9 0v7c-1.5 3-4 5-6 5s-3-2-3-5V6Zm18 0c-3-2-6-2-9 0v7c1.5 3 4 5 6 5s3-2 3-5V6Z" /><path d="M6 10h.01M9 10h.01m6 0h.01m3 0h.01M6 14c1 .7 2 .7 3 0m6 0c1 .7 2 .7 3 0" /></>,
  pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  phone: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 18h4" /></>,
  printer: <><path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6zM18 12h.01" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></>,
  screen: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4m-3-12 6 3-6 3V9Z" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 15l.7 1.3L7 17l-1.3.7L5 19l-.7-1.3L3 17l1.3-.7L5 15Z" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" fill="currentColor" stroke="none" />,
  ticket: <><path d="M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V7Z" /><path d="M13 8v2m0 3v2m0 3v1" /></>,
  warning: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3h.01" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.5a4 4 0 0 1 0 7.8m6 10.2v-2a4 4 0 0 0-3-3.9" /></>,
  revenue: <><path d="M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
};

export default function Icon({ name, size = 20, className = '', title }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {paths[name] || paths.sparkle}
    </svg>
  );
}
