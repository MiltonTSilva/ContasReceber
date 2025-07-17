import React from "react";

type MoneyInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function formatMoney(value: string): string {
  value = value.replace(/\D/g, "");
  const intValue = parseInt(value, 10);
  if (isNaN(intValue)) return "R$ 0,00";
  const formatted = (intValue / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return formatted;
}

const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  className,
}) => {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(formatMoney(e.target.value));
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="R$ 0,00"
      maxLength={20}
      className={className}
    />
  );
};

export default MoneyInput;
