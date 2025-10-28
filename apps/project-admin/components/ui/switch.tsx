import * as React from "react";

// Placeholder component
export const Switch = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ ...props }, ref) => (
    <input type="checkbox" ref={ref} {...props} />
  )
);
Switch.displayName = "Switch";
