
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  path: string;
}

export const Icon: React.FC<IconProps> = ({ path, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);
