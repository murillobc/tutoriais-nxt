import { forwardRef, useState } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface InputMaskProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: "cpf" | "phone" | "cnpj";
}

export const InputMask = forwardRef<HTMLInputElement, InputMaskProps>(
  ({ mask, onChange, value, className, ...props }, ref) => {
    const [maskedValue, setMaskedValue] = useState(value || "");

    const applyMask = (inputValue: string, maskType: string) => {
      let numericValue = inputValue.replace(/\D/g, "");
      
      switch (maskType) {
        case "cpf":
          if (numericValue.length > 11) numericValue = numericValue.slice(0, 11);
          numericValue = numericValue.replace(/(\d{3})(\d)/, "$1.$2");
          numericValue = numericValue.replace(/(\d{3})(\d)/, "$1.$2");
          numericValue = numericValue.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
          break;
        case "phone":
          if (numericValue.length > 11) numericValue = numericValue.slice(0, 11);
          numericValue = numericValue.replace(/(\d{2})(\d)/, "($1) $2");
          numericValue = numericValue.replace(/(\d{5})(\d)/, "$1-$2");
          break;
        case "cnpj":
          if (numericValue.length > 14) numericValue = numericValue.slice(0, 14);
          numericValue = numericValue.replace(/(\d{2})(\d)/, "$1.$2");
          numericValue = numericValue.replace(/(\d{3})(\d)/, "$1.$2");
          numericValue = numericValue.replace(/(\d{3})(\d)/, "$1/$2");
          numericValue = numericValue.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
          break;
        default:
          break;
      }
      
      return numericValue;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = applyMask(e.target.value, mask);
      setMaskedValue(newValue);
      
      if (onChange) {
        const event = { ...e, target: { ...e.target, value: newValue } };
        onChange(event);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={maskedValue}
        onChange={handleChange}
        className={cn(className)}
      />
    );
  }
);

InputMask.displayName = "InputMask";
