import { Plus } from "lucide-react";

type ActionButtonProps = {
  children: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

export const ActionButton = ({ children, onClick, className = "" }: ActionButtonProps) => (
  <button 
    onClick={onClick}
    className={`bg-white text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-neutral-300 transition-colors flex items-center gap-2 justify-center ${className}`}
  >
    {children}
  </button>
);
