import { cn } from '@/lib/utils';
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPasswordType = type === 'password';
     return (
      <div className="relative w-full">
        <Input
          type={isPasswordType ? (showPassword ? 'text' : 'password') : type}
          ref={ref}
          {...props}
          placeholder=" "
           className={cn(
            `peer h-12 w-full rounded-xl border bg-white px-4 pt-4 pb-2 text-sm shadow-sm
            placeholder-transparent focus:outline-none pr-10`,
            error ? 'border-red-500' : 'border-blue-500',
            className
          )}
        />
        <Label
          htmlFor={props.id}
          className={cn(
            `absolute left-4 top-[10px] z-10 bg-white px-1 text-sm
            -translate-y-5`,
            error ? 'text-red-500' : 'text-blue-500'
          )}
        >
          {label}
        </Label>

        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-4 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';
export { FloatingLabelInput };
