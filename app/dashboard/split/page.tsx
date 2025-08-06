import { useState } from "react";
import { ActionButton } from "../components/ui/ActionButton";
import { AddSplitDialog } from "../components/AddSplitDialog";
import { SplitsDisplay } from "../components/SplitsDisplay";

export const SplitManagement = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSplitCreated = () => {
    // Increment trigger to refresh the splits display
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Split Management</h2>
          <p className="text-neutral-400">Manage and track shared expenses with friends and family.</p>
        </div>
        <AddSplitDialog onSplitCreated={handleSplitCreated}>
          <ActionButton onClick={() => {}}>Add New Split</ActionButton>
        </AddSplitDialog>
      </div>

      {/* Splits Display */}
      <SplitsDisplay refreshTrigger={refreshTrigger} />
    </div>
  );
};
