import { Input } from "@/components/ui/input";
import { forwardRef } from "react";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange: (value: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const formatPhoneNumber = (input: string) => {
      const cleaned = input.replace(/\D/g, '');
      const limited = cleaned.substring(0, 10);
      
      if (limited.length <= 3) {
        return limited;
      } else if (limited.length <= 6) {
        return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
      } else {
        return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      onChange(formatted);
    };

    return (
      <Input
        ref={ref}
        type="tel"
        value={value || ''}
        onChange={handleChange}
        placeholder="(555) 123-4567"
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";