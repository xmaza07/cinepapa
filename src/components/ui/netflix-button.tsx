import React from 'react';
import { cn } from '@/lib/utils';
import { VariantProps, cva } from 'class-variance-authority';

const netflixButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-white text-black hover:bg-white/90',
        secondary: 'bg-white/30 text-white border border-white/50 hover:bg-white/40',
        info: 'bg-netflix-medium-gray/70 text-white border border-white/30 hover:bg-netflix-medium-gray/90',
      },
      size: {
        default: 'px-6 py-2 text-base',
        sm: 'px-4 py-1.5 text-sm',
        lg: 'px-8 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface NetflixButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof netflixButtonVariants> {
  asChild?: boolean;
}

const NetflixButton = React.forwardRef<HTMLButtonElement, NetflixButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(netflixButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

NetflixButton.displayName = 'NetflixButton';

export { NetflixButton, netflixButtonVariants };
