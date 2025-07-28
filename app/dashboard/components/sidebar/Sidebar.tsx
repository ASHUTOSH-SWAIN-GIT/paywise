import { 
  Split, 
  RefreshCw, 
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

type SidebarProps = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
};

export const Sidebar = ({ 
  sidebarCollapsed, 
  setSidebarCollapsed, 
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
    <div className={`bg-neutral-900 border-r border-neutral-800 transition-all duration-300 ease-in-out flex flex-col ${
      sidebarCollapsed ? "w-20" : "w-64"
    }`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between h-20">
        {!sidebarCollapsed && (
          <h1 className="text-xl font-bold text-white">Paywise</h1>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          )}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="p-4 space-y-2 flex-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? "bg-white text-black" 
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              } ${sidebarCollapsed ? "justify-center" : ""}`}
              title={sidebarCollapsed ? item.label : ""}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <div className="text-left">
                  <div className="font-semibold">{item.label}</div>
                  <div className={`text-xs ${
                    isActive ? "text-neutral-600" : "text-neutral-500"
                  }`}>
                    {item.description}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
