import  SplitManagement  from "../split/page";
import RecurringPayments  from "../recuring/page";
import TrackExpense  from "../track/page";

type MainContentProps = {
  activeSection: string;
};

export const MainContent = ({ activeSection }: MainContentProps) => {
  const renderContent = () => {
    switch (activeSection) {
      case "split-management":
        return <SplitManagement />;
      case "recurring-payments":
        return <RecurringPayments />;
      case "track-expense":
        return <TrackExpense />;
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto">
      {renderContent()}
    </main>
  );
};
