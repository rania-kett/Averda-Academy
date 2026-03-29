import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
  to?: string;
  label: string;
};

export function AdminBackButton({ to, label }: Props) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="mb-6 inline-flex items-center gap-2 text-sm text-admin-muted transition hover:text-accent-indigo"
    >
      <ArrowLeft className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden />
      {label}
    </button>
  );
}
