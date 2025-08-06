"use client";

import React, { useState } from "react";
import { ActionButton } from "../components/ui/ActionButton";
import { AddExpenseDialog } from "../components/AddExpenseDialog";
import { ExpenseDisplay } from "../components/ExpenseDisplay";

export default function TrackExpense() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Track Personal Expenses</h2>
          <p className="text-neutral-400">Monitor your personal day-to-day spending and expense patterns.</p>
        </div>
        
        {/* Add Expense Button */}
        <AddExpenseDialog onExpenseAdded={handleExpenseAdded}>
          <ActionButton onClick={() => {}}>Add Expense</ActionButton>
        </AddExpenseDialog>
      </div>

      {/* Display Expenses */}
      <ExpenseDisplay refreshTrigger={refreshTrigger} />
    </div>
  );
}
