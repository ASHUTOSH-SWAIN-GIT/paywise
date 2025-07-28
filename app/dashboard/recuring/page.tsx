import React from "react";
import { ActionButton } from "../components/ui/ActionButton";

export const RecurringPayments = () => {
  return (
    <div className="p-6 md:p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Recurring Payments</h2>
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <p className="text-neutral-400 mb-6">Manage your recurring bills and subscriptions.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-neutral-800 rounded-lg p-4 bg-black/50">
            <h3 className="font-semibold text-white mb-2">Active Subscriptions</h3>
            <p className="text-neutral-500 text-sm">No subscriptions found</p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-4 bg-black/50">
            <h3 className="font-semibold text-white mb-2">Upcoming Bills</h3>
            <p className="text-neutral-500 text-sm">No upcoming bills</p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-4 bg-black/50 flex flex-col justify-center items-start">
             <h3 className="font-semibold text-white mb-2">Quick Actions</h3>
            <ActionButton onClick={() => { /* TODO: handle add recurring bill */ }}>Add Recurring Bill</ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};
