import { ActionButton } from "../components/ui/ActionButton";
import { AddSplitDialog } from "../components/AddSplitDialog";

export const SplitManagement = () => {
  return (
    <div className="p-6 md:p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Split Management</h2>
     
        <p className="text-neutral-400 mb-6">Manage and track shared expenses with friends and family.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border-4 border-neutral-800 rounded-lg p-4 bg-black/50">
            <h3 className="font-semibold text-white mb-2">Recent Splits</h3>
            <p className="text-neutral-500 text-sm">No recent splits found</p>
          </div>
          <div className="border-4 border-neutral-800 rounded-lg p-4 bg-black/50">
            <h3 className="font-semibold text-white mb-2">Pending Payments</h3>
            <p className="text-neutral-500 text-sm">All caught up!</p>
          </div>
          <div className="border-4 border-neutral-800 rounded-lg p-4 bg-black/50 flex flex-col justify-center items-start">
            <h3 className="font-semibold text-white mb-2">Quick Actions</h3>
            <AddSplitDialog>
              <ActionButton onClick={() => {}}>Add New Split</ActionButton>
            </AddSplitDialog>
          </div>
        </div>
      
    </div>
  );
};
