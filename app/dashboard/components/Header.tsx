import { Plus } from "lucide-react";
import { ActionButton } from "./ui/ActionButton";

export const Header = () => {
  return (
    <header className="bg-neutral-900 border-b border-neutral-800 p-4 h-20 flex items-center">
      <div className="w-full flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-400 text-sm">Welcome back to Paywise</p>
        </div>
        <ActionButton onClick={() => { /* TODO: handle quick add */ }}>
          <Plus className="w-4 h-4"/>
          <span>Quick Add</span>
        </ActionButton>
      </div>
    </header>
  );
};
