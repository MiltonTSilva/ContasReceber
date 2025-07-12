import type { FC } from "react";
import { useMask } from "@react-input/mask";

interface PhoneInputProps {
  mobile: string;
  setMobile: (value: string) => void;
  className?: string;
}

const PhoneInput: FC<PhoneInputProps> = ({
  mobile,
  setMobile,
  className,
}: PhoneInputProps) => {
  const inputRef = useMask({
    mask: "(99) 9.9999-9999",
    replacement: { 9: /\d/ },
  });

  return (
    <input
      ref={inputRef}
      value={mobile}
      onChange={(e) => setMobile(e.target.value)}
      placeholder="Digite o celular."
      type="tel"
      className={className}
      required
    />
  );
};

export default PhoneInput;
