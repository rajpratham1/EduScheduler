// components/avatars.ts
import React from 'react';

const Avatar1: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="128" height="128" {...props}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
            <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
        </mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#7a4a2b"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(4 4) rotate(240 18 18) scale(1.1)" fill="#ffb43c" rx="6"></rect>
            <g transform="translate(2 -2) rotate(0 18 18)">
                <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#000000"></path>
                <rect x="12" y="14" width="3.5" height="3.5" rx="1" fill="#FFFFFF"></rect>
                <rect x="20" y="14" width="3.5" height="3.5" rx="1" fill="#FFFFFF"></rect>
            </g>
        </g>
    </svg>
);

const Avatar2: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="128" height="128" {...props}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#2c7a3f"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(-4 -4) rotate(10 18 18) scale(1.2)" fill="#f7f6f5" rx="36"></rect>
            <g transform="translate(-4 -3.5) rotate(-5 18 18)">
                <path d="M15 20c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round"></path>
                <rect x="13" y="14" width="3.5" height="3.5" rx="1" fill="#000000"></rect>
                <rect x="20" y="14" width="3.5" height="3.5" rx="1" fill="#000000"></rect>
            </g>
        </g>
    </svg>
);

const Avatar3: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="128" height="128" {...props}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#9565f5"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(0 0) rotate(329 18 18) scale(1)" fill="#f7f6f5" rx="6"></rect>
            <g transform="translate(-4.5 3.5) rotate(9 18 18)">
                <path d="M13,19 a1,0.75 0 0,0 10,0" fill="#000000"></path>
                <rect x="10" y="14" width="3.5" height="3.5" rx="1" fill="#FFFFFF"></rect>
                <rect x="22" y="14" width="3.5" height="3.5" rx="1" fill="#FFFFFF"></rect>
            </g>
        </g>
    </svg>
);

const Avatar4: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="128" height="128" {...props}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#d74d25"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(6 6) rotate(269 18 18) scale(1)" fill="#f7f6f5" rx="36"></rect>
            <g transform="translate(1 1) rotate(-9 18 18)">
                <path d="M15 21c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round"></path>
                <rect x="14" y="14" width="3.5" height="3.5" rx="1" fill="#000000"></rect>
                <rect x="20" y="14" width="3.5" height="3.5" rx="1" fill="#000000"></rect>
            </g>
        </g>
    </svg>
);
const Avatar5: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="128" height="128" {...props}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#f59788"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(5 -5) rotate(25 18 18) scale(1.2)" fill="#1c1c1c" rx="6"></rect>
            <g transform="translate(-1 -3) rotate(0 18 18)">
                <path d="M15 20c2 1 4 1 6 0" stroke="#FFFFFF" fill="none" strokeLinecap="round"></path>
                <rect x="13" y="14" width="3.5" height="3.5" rx="1" fill="#FFFFFF"></rect>
                <rect x="20" y="14" width="3.5" height="3.5" rx="1" fill="#FFFFFF"></rect>
            </g>
        </g>
    </svg>
);

const Avatar6: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="128" height="128" {...props}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#171717"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(7 1) rotate(333 18 18) scale(1.1)" fill="#f59788" rx="36"></rect>
            <g transform="translate(-7 3) rotate(-3 18 18)">
                <path d="M13,22 a1,0.75 0 0,0 10,0" fill="#000000"></path>
                <rect x="13" y="14" width="3.5" height="3.5" rx="1" fill="#000000"></rect>
                <rect x="20" y="14" width="3.5" height="3.5" rx="1" fill="#000000"></rect>
            </g>
        </g>
    </svg>
);


export const AVATARS: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    avatar1: Avatar1,
    avatar2: Avatar2,
    avatar3: Avatar3,
    avatar4: Avatar4,
    avatar5: Avatar5,
    avatar6: Avatar6,
};
