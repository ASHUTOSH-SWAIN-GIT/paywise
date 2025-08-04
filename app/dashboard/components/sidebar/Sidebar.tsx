import { 
  Split, 
  RefreshCw, 
  TrendingUp
} from "lucide-react";

type SidebarProps = {
  activeSection: string;
  setActiveSection: (section: string) => void;
};

export const Sidebar = ({ 
  activeSection, 
  setActiveSection 
}: SidebarProps) => {
  const sidebarItems = [
    {
      id: "split-management",
      label: "Split Management",
      icon: Split,
      description: "Manage shared expenses"
    },
    {
      id: "recurring-payments",
      label: "Recurring Payments", 
      icon: RefreshCw,
      description: "Track recurring bills"
    },
    {
      id: "track-expense",
      label: "Track Expense",
      icon: TrendingUp,
      description: "Monitor your spending"
    }
  ];

  return (
    <div className="bg-neutral-900 border-r border-neutral-800 w-24 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-center h-20">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-sm">P</span>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="p-2 space-y-3 flex-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? "bg-white text-black" 
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium leading-tight text-center">
                {item.id === "split-management" && "Split"}
                {item.id === "recurring-payments" && "Recurring"}
                {item.id === "track-expense" && "Track"}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
