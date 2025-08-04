"use client";

import React, { useState } from "react";
import { ActionButton } from "../components/ui/ActionButton";
import { AddRecurringBillDialog } from "../components/AddRecurringBillDialog";
import { RecurringBillsDisplay } from "../components/RecurringBillsDisplay";

export const RecurringPayments = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleBillAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-6 md:p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Recurring Payments</h2>
      <p className="text-neutral-400 mb-6">Manage your recurring bills and subscriptions.</p>
      
      {/* Add Recurring Bill Button */}
      <div className="mb-6">
        <AddRecurringBillDialog onBillAdded={handleBillAdded}>
          <ActionButton onClick={() => {}}>Add Recurring Bill</ActionButton>
        </AddRecurringBillDialog>
      </div>

      {/* Display Recurring Bills */}
      <RecurringBillsDisplay refreshTrigger={refreshTrigger} />
    </div>
  );
};
