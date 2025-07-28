import { ActionButton } from "../ui/ActionButton";

export const TrackExpense = () => {
  return (
    <div className="p-6 md:p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Track Expense</h2>
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <p className="text-neutral-400 mb-6">Monitor your spending patterns and expense history.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-neutral-800 rounded-lg p-4 bg-black/50">
            <h3 className="font-semibold text-white mb-2">This Month</h3>
            <p className="text-3xl font-bold text-white">₹0</p>
            <p className="text-neutral-500 text-sm">Total spent</p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-4 bg-black/50">
            <h3 className="font-semibold text-white mb-2">Categories</h3>
            <p className="text-neutral-500 text-sm">No expenses recorded</p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-4 bg-black/50 flex flex-col justify-center items-start">
             <h3 className="font-semibold text-white mb-2">Quick Actions</h3>
            <ActionButton onClick={() => { /* TODO: handle add expense */ }}>Add Expense</ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};
