'use client';

import { useState } from 'react';
import { Search, DollarSign, Bell, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUsers } from '@/lib/hooks/useUsers';
import { createSplitAction } from '@/lib/actions/split-actions';
import { CurrencyAmountInput, formatCurrency } from '@/components/ui/CurrencyAmountInput';

interface AddSplitDialogProps {
  children: React.ReactNode;
  onSplitCreated?: () => void;
}

interface FormData {
  amount: string;
  currency: string;
  selectedUsers: string[];
  notificationInterval: string;
  description: string;
  splitType: 'equal' | 'custom';
  customAmounts: { [userId: string]: string };
}

export function AddSplitDialog({ children, onSplitCreated }: AddSplitDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    currency: 'INR', // Default to Indian Rupee
    selectedUsers: [],
    notificationInterval: 'weekly',
    description: '',
    splitType: 'equal',
    customAmounts: {},
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { users, loading: usersLoading } = useUsers();

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPeople = formData.selectedUsers.length + 1; // +1 for the current user
  const amountPerPerson = formData.amount ? parseFloat(formData.amount) / totalPeople : 0;

  // Calculate total of custom amounts
  const getTotalCustomAmount = () => {
    const customTotal = Object.values(formData.customAmounts).reduce((sum, amount) => {
      return sum + (parseFloat(amount) || 0);
    }, 0);
    return customTotal;
  };

  const getRemainingAmount = () => {
    const totalAmount = parseFloat(formData.amount) || 0;
    const customTotal = getTotalCustomAmount();
    return totalAmount - customTotal;
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedUsers.includes(userId);
      const newSelectedUsers = isSelected
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId];
      
      // Remove custom amount if user is deselected
      const newCustomAmounts = { ...prev.customAmounts };
      if (isSelected) {
        delete newCustomAmounts[userId];
      }
      
      return {
        ...prev,
        selectedUsers: newSelectedUsers,
        customAmounts: newCustomAmounts
      };
    });
  };

  const handleCustomAmountChange = (userId: string, amount: string) => {
    setFormData(prev => ({
      ...prev,
      customAmounts: {
        ...prev.customAmounts,
        [userId]: amount
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || formData.selectedUsers.length === 0) {
      toast.error("Please enter an amount and select at least one person to split with.");
      return;
    }

    // Validate custom amounts if using custom split
    if (formData.splitType === 'custom') {
      const totalAmount = parseFloat(formData.amount);
      const customTotal = getTotalCustomAmount();
      
      if (Math.abs(customTotal - totalAmount) > 0.01) {
        toast.error(`Custom amounts must add up to $${totalAmount.toFixed(2)}. Current total: $${customTotal.toFixed(2)}`);
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      const result = await createSplitAction({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description || 'Expense split',
        selectedUserIds: formData.selectedUsers,
        notificationInterval: formData.notificationInterval,
        splitType: formData.splitType,
        customAmounts: formData.customAmounts,
      });

      if (result.success) {
        setOpen(false);
        // Reset form state after successful submission
        setFormData({
          amount: '',
          currency: 'INR',
          selectedUsers: [],
          notificationInterval: 'weekly',
          description: '',
          splitType: 'equal',
          customAmounts: {},
        });
        setSearchQuery('');
        
        toast.success('Split created successfully!', {
          description: `Created split of $${formData.amount} with ${formData.selectedUsers.length} other people.`
        });

        // Trigger refresh of splits list
        if (onSplitCreated) {
          onSplitCreated();
        }
      } else {
        toast.error('Failed to create split', {
          description: result.error || 'Please try again.'
        });
      }
    } catch (error) {
      console.error('Error creating split:', error);
      toast.error('Something went wrong', {
        description: 'An unexpected error occurred. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-black border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Add New Split</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new expense split with your friends and family.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Field with Currency */}
          <CurrencyAmountInput
            id="amount"
            label="Amount"
            amount={formData.amount}
            currency={formData.currency}
            onAmountChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
            onCurrencyChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
            placeholder="0.00"
            required={true}
          />
          {formData.amount && formData.selectedUsers.length > 0 && (
            <div className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded-md">
              <p>Splitting between {totalPeople} people: <span className="text-white font-semibold">{formatCurrency(amountPerPerson, formData.currency)} each</span></p>
            </div>
          )}

          {/* Description Field */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-bold text-gray-300">
              Description
            </label>
            <input
              id="description"
              type="text"
              placeholder="e.g., Dinner, movie tickets..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-black border-2 border-gray-700 rounded-lg placeholder-gray-500 focus:outline-none  focus:ring-2 focus:ring-white focus:border-white"
            />
          </div>

          {/* Split Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300">Split Type</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, splitType: 'equal', customAmounts: {} }))}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                  formData.splitType === 'equal' 
                    ? 'bg-white text-black border-white' 
                    : 'bg-black text-gray-300 border-gray-700 hover:border-gray-600'
                }`}
              >
                Equal Split
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, splitType: 'custom' }))}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                  formData.splitType === 'custom' 
                    ? 'bg-white text-black border-white' 
                    : 'bg-black text-gray-300 border-gray-700 hover:border-gray-600'
                }`}
              >
                Custom Amounts
              </button>
            </div>
          </div>

          {/* User Search and Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300">Split with</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-black border-2 border-gray-700 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
              />
            </div>
            
            {/* User List */}
            <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg bg-black">
              {usersLoading ? (
                <div className="flex items-center justify-center p-4 text-sm text-gray-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading users...</span>
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSelected = formData.selectedUsers.includes(user.id);
                  const customAmount = formData.customAmounts[user.id] || '';
                  return (
                    <div
                      key={user.id}
                      className={`p-3 transition-colors ${isSelected ? 'bg-gray-800' : 'hover:bg-gray-900'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className={`flex h-5 w-5 items-center justify-center rounded border cursor-pointer ${isSelected ? 'border-white bg-white' : 'border-gray-600'}`}
                          onClick={() => handleUserToggle(user.id)}
                        >
                          {isSelected && <Check className="h-4 w-4 text-black" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{user.name || 'Unknown User'}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                        {/* Custom Amount Input */}
                        {isSelected && formData.splitType === 'custom' && (
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-3 w-3 text-gray-500" />
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={customAmount}
                              onChange={(e) => handleCustomAmountChange(user.id, e.target.value)}
                              className="w-20 px-2 py-1 text-xs bg-black border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                            />
                          </div>
                        )}
                        {/* Equal Split Amount Display */}
                        {isSelected && formData.splitType === 'equal' && formData.amount && (
                          <div className="text-xs text-gray-400">
                            ${amountPerPerson.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 px-4 text-sm text-gray-400">
                  <p>{searchQuery ? `No users found for "${searchQuery}"` : 'No other users available.'}</p>
                </div>
              )}
            </div>
            
            {/* Custom Split Summary */}
            {formData.splitType === 'custom' && formData.selectedUsers.length > 0 && formData.amount && (
              <div className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded-md">
                <div className="flex justify-between">
                  <span>Total amount:</span>
                  <span>${parseFloat(formData.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assigned amount:</span>
                  <span>${getTotalCustomAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className={getRemainingAmount() < 0 ? 'text-red-400' : 'text-white'}>
                    ${getRemainingAmount().toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notification Interval */}
          <div className="space-y-2">
            <label htmlFor="notification" className="text-sm font-bold text-gray-300">
              Notification Reminders
            </label>
            <div className="relative">
              <Bell className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <select
                id="notification"
                value={formData.notificationInterval}
                onChange={(e) => setFormData(prev => ({ ...prev, notificationInterval: e.target.value }))}
                className="w-full appearance-none pl-10 pr-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-black border border-gray-700 rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.amount || formData.selectedUsers.length === 0 || isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed border-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Split'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}