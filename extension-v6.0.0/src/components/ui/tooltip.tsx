import * as React from 'react';
import { cn } from '../../lib/utils';

type TooltipProps = {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
};

export const Tooltip = ({
  children,
  content,
  side = 'top',
  delayDuration = 300,
}: TooltipProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  let timeoutId: NodeJS.Timeout;

  const showTooltip = () => {
    timeoutId = setTimeout(() => {
      setIsOpen(true);
      // Small delay for the animation
      setTimeout(() => setIsVisible(true), 10);
    }, delayDuration);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
    // Wait for the fade-out animation to complete
    setTimeout(() => setIsOpen(false), 150);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap',
            'transition-opacity duration-150',
            isVisible ? 'opacity-100' : 'opacity-0',
            positionClasses[side]
          )}
          role="tooltip"
        >
          {content}
          <div 
            className={cn(
              'absolute w-2 h-2 bg-gray-900 transform rotate-45',
              side === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
              side === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2',
              side === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
              side === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2',
            )}
          />
        </div>
      )}
    </div>
  );
};

type TooltipProviderProps = {
  children: React.ReactNode;
  delayDuration?: number;
};

export const TooltipProvider = ({ 
  children, 
  delayDuration = 300 
}: TooltipProviderProps) => {
  return (
    <div className="relative">
      {children}
    </div>
  );
};

type TooltipTriggerProps = {
  children: React.ReactNode;
  asChild?: boolean;
};

export const TooltipTrigger = ({ 
  children, 
  asChild = false 
}: TooltipTriggerProps) => {
  return <>{children}</>;
};

type TooltipContentProps = {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
};

export const TooltipContent = ({
  children,
  className,
  side = 'top',
  sideOffset = 0,
  ...props
}: TooltipContentProps) => {
  return (
    <div 
      className={cn(
        'z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
