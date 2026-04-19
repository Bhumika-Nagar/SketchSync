import type { ChangeEventHandler, InputHTMLAttributes } from "react";

type InputProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
} & Pick<InputHTMLAttributes<HTMLInputElement>, "placeholder" | "type">;

export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: InputProps) {
  return (
    <input
      value={value}
      onChange={onChange}
      type={type}
      placeholder={placeholder}
      className="w-full px-4 py-2 mb-4 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}
