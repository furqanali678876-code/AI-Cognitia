import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-2xl font-semibold cursor-pointer transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-card hover:bg-primary/92",
        accent: "bg-accent text-accent-foreground shadow-card hover:bg-accent/92",
        soft: "bg-primary-soft text-primary hover:bg-secondary",
        lavender: "bg-lavender text-lavender-foreground hover:bg-secondary",
        outline: "border-2 border-input bg-card text-foreground hover:bg-primary-soft",
        ghost: "text-foreground hover:bg-primary-soft",
        success: "bg-success text-success-foreground shadow-card hover:bg-success/92",
        destructive:
          "bg-destructive text-destructive-foreground shadow-card hover:bg-destructive/92",
        link: "text-primary underline underline-offset-4 hover:text-accent",
      },
      size: {
        default: "min-h-14 px-6 py-3 text-lg",
        lg: "min-h-16 px-8 py-4 text-xl w-full",
        sm: "min-h-12 px-4 py-2 text-base",
        icon: "size-14 rounded-2xl",
        link: "min-h-12 px-2 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
