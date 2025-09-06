// components/icons.tsx
import React from 'react';

// Utility component to create icons from SVG paths
const Icon: React.FC<React.SVGProps<SVGSVGElement> & { path: string | string[], fillRule?: 'evenodd' | 'nonzero' | undefined, clipRule?: 'evenodd' | 'nonzero' | undefined }> = ({ path, fillRule, clipRule, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    {Array.isArray(path) ? path.map((p, i) => <path key={i} d={p} />) : <path fillRule={fillRule || "evenodd"} d={path} clipRule={clipRule || "evenodd"} />}
  </svg>
);

export const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" {...props} />
);

export const BuildingOfficeIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M4 4a1 1 0 011-1h5a1 1 0 011 1v2h1V4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2h-1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm2 2v1h5V6H6zm-1 3v1h5V9H5zm1 3v1h5v-1H6z" {...props} />
);

export const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M3.5 4.5a2.5 2.5 0 013.163-2.323l.136.068.136.068 5 2.5a2.5 2.5 0 010 4.354l-5 2.5-.136.068-.136.068A2.5 2.5 0 013.5 9.5v-5zM5 6.054v3.692l4-1.846-4-1.846z" fillRule='nonzero' {...props}/>
);

export const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M10 2.5a7.5 7.5 0 015.632 12.399l-1.066-1.066A6 6 0 0010 4a6 6 0 00-5.916 5H6.5a.5.5 0 010 1H3a.5.5 0 01-.5-.5V6.5a.5.5 0 011 0v1.916A7.5 7.5 0 0110 2.5zm-1.066 12.567l1.066 1.066A7.5 7.5 0 014.368 7.601l1.066 1.066A6 6 0 0010 16a6 6 0 005.916-5H13.5a.5.5 0 010-1H17a.5.5 0 01.5.5v3.5a.5.5 0 01-1 0v-1.916A7.5 7.5 0 018.934 15.067z" {...props} />
);

export const MagicWandIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M9.52 2.47a.75.75 0 011.06 0l1.5 1.5a.75.75 0 01-1.06 1.06l-1.5-1.5a.75.75 0 010-1.06zm-4 4a.75.75 0 011.06 0l6 6a.75.75 0 01-1.06 1.06l-6-6a.75.75 0 010-1.06zm.5-3.5a.5.5 0 100-1 .5.5 0 000 1zm-1.5 1.5a.5.5 0 10-1 0 .5.5 0 001 0zm1.5-1.5a.5.5 0 100-1 .5.5 0 000 1z" {...props} />
);

export const SparklesIcon = MagicWandIcon; // Alias

export const UserGroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3zm12.75-7.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM14.25 15a.75.75 0 00.75-.75v-1.5a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75z" {...props} />
);

export const ChartPieIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M10 18a8 8 0 100-16 8 8 0 000 16zM9 2a6 6 0 016 6h-6V2zm-2 2a6 6 0 01-2 4h4V4H7zM4 11a6 6 0 014-4v4H4zm5 5a6 6 0 01-4-4h4v4z" {...props} />
);

export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z M4 5a1 1 0 011-1h10a1 1 0 011 1v1H4V5z M3 7h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" {...props} />
);

export const MagnifyingGlassIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" {...props} />
);

export const AcademicCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M3.5 4.5a2.5 2.5 0 013.163-2.323l.136.068 7.5 3.75a2.5 2.5 0 010 4.904l-7.5 3.75-.136.068a2.5 2.5 0 01-3.299-2.573V4.5zm1.5.5v6.5a1 1 0 001.32.949l5-2.5a1 1 0 000-1.898l-5-2.5a1 1 0 00-1.32.949z" {...props} />
);

export const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M8.485 1.515a2 2 0 013.03 0l6 6a2 2 0 01-1.515 3.515H3.98a2 2 0 01-1.515-3.515l6-6zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" {...props} />
);

export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" {...props} />
);

export const CalendarDaysIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <Icon path="M6 3.5A1.5 1.5 0 017.5 2h5A1.5 1.5 0 0114 3.5v1A1.5 1.5 0 0112.5 6h-5A1.5 1.5 0 016 4.5v-1zM4.5 7A1.5 1.5 0 016 5.5h8A1.5 1.5 0 0115.5 7v7A1.5 1.5 0 0114 15.5H6A1.5 1.5 0 014.5 14V7z M7 9.5a.5.5 0 000 1h6a.5.5 0 000-1H7z" {...props} />
);
export const CalendarIcon = CalendarDaysIcon; // Alias

export const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
    <Icon path="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.226 4.226a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm1.226 4.774a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm4.774-1.226a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zm-1.226-4.774a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 14a4 4 0 100-8 4 4 0 000 8z" {...props} />
);

export const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
    <Icon path="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" {...props} />
);

export const Cog6ToothIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
    <Icon path="M10 12a2 2 0 100-4 2 2 0 000 4z M4.025 10a6.012 6.012 0 012.16-4.79L5.05 4.075a.75.75 0 011.06-1.06l1.135 1.135A6 6 0 0110 4c.642 0 1.261.1 1.84.28l1.135-1.135a.75.75 0 011.06 1.06l-1.135 1.135A6.012 6.012 0 0115.975 10c0 .642-.1 1.261-.28 1.84l1.135 1.135a.75.75 0 01-1.06 1.06l-1.135-1.135a6.012 6.012 0 01-4.79 2.16c-.642 0-1.261-.1-1.84-.28l-1.135 1.135a.75.75 0 01-1.06-1.06l1.135-1.135A6.012 6.012 0 014.025 10z" {...props} />
);

export const ArrowLeftOnRectangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
    <Icon path="M10.75 4.75a.75.75 0 00-1.5 0v2.5h-3.5a.75.75 0 000 1.5h3.5v2.5a.75.75 0 001.5 0v-6.5z M4 3a1 1 0 00-1 1v12a1 1 0 001 1h5.5a.75.75 0 000-1.5H4.75v-11.5H9.25a.75.75 0 000-1.5H4z" {...props} />
);

export const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
    <Icon path="M10 12a2 2 0 100-4 2 2 0 000 4z M2 10a8 8 0 1116 0 8 8 0 01-16 0z" {...props} />
);
