import type { ButtonHTMLAttributes } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`rounded-md bg-sky-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-sky-400 ${className}`} type="button" {...props} />;
}
