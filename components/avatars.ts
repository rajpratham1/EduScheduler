// components/avatars.ts
// FIX: Rewrote avatar components using React.createElement to avoid JSX in a .ts file.
// This resolves TypeScript errors related to unrecognized JSX syntax.
import React from 'react';

const Avatar1 = (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 80", fill: "none", xmlns: "http://www.w3.org/2000/svg", ...props },
        React.createElement('rect', { width: "80", height: "80", rx: "40", fill: "#E2E8F0" }),
        React.createElement('path', { d: "M62 40C62 52.1503 52.1503 62 40 62C27.8497 62 18 52.1503 18 40V39.5C18 27.634 27.8497 18 39.5 18H40C52.1503 18 62 27.8497 62 40Z", fill: "#475569" })
    )
);

const Avatar2 = (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 80", fill: "none", xmlns: "http://www.w3.org/2000/svg", ...props },
        React.createElement('rect', { width: "80", height: "80", rx: "40", fill: "#FBBF24" }),
        React.createElement('rect', { x: "18", y: "18", width: "44", height: "44", rx: "22", fill: "#FDE68A" }),
        React.createElement('path', { d: "M40 62C52.1503 62 62 52.1503 62 40H18C18 52.1503 27.8497 62 40 62Z", fill: "#EA580C" })
    )
);

const Avatar3 = (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 80", fill: "none", xmlns: "http://www.w3.org/2000/svg", ...props },
        React.createElement('rect', { width: "80", height: "80", rx: "40", fill: "#A78BFA" }),
        React.createElement('rect', { x: "18", y: "18", width: "44", height: "44", rx: "22", fill: "#1E293B" }),
        React.createElement('path', { d: "M40 62C27.8497 62 18 52.1503 18 40C18 27.8497 27.8497 18 40 18L62 40C62 52.1503 52.1503 62 40 62Z", fill: "#EDE9FE" })
    )
);

const Avatar4 = (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 80", fill: "none", xmlns: "http://www.w3.org/2000/svg", ...props },
        React.createElement('rect', { width: "80", height: "80", rx: "40", fill: "#38BDF8" }),
        React.createElement('circle', { cx: "40", cy: "40", r: "22", fill: "#DBEAFE" }),
        React.createElement('path', { d: "M40 18C27.8497 18 18 27.8497 18 40C18 52.1503 27.8497 62 40 62V18Z", fill: "#0EA5E9" })
    )
);

const Avatar5 = (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 80", fill: "none", xmlns: "http://www.w3.org/2000/svg", ...props },
        React.createElement('rect', { width: "80", height: "80", rx: "40", fill: "#FB7185" }),
        React.createElement('path', { d: "M18 18H62V62H18V18Z", fill: "#F1F5F9" }),
        React.createElement('path', { d: "M40 40H18V18H40V40Z", fill: "#BE123C" }),
        React.createElement('path', { d: "M62 62H40V40H62V62Z", fill: "#475569" })
    )
);

export const AVATARS = {
    avatar1: Avatar1,
    avatar2: Avatar2,
    avatar3: Avatar3,
    avatar4: Avatar4,
    avatar5: Avatar5,
};
