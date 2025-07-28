'use client';

import { useState } from 'react';
import { Search, DollarSign, Bell, Loader2 } from 'lucide-react';
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

interface AddSplitDialogProps {
  children: React.ReactNode;
}

interface FormData {
  amount: string;
  selectedUsers: string[];
  notificationInterval: string;
  description: string;
}

export function AddSplitDialog({ children }: AddSplitDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    selectedUsers: [],
    notificationInterval: 'weekly',
    description: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { users, loading: usersLoading } = useUsers();

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPeople = formData.selectedUsers.length + 1; // +1 for current user
  const amountPerPerson = formData.amount ? parseFloat(formData.amount) / totalPeople : 0;

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || formData.selectedUsers.length === 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await createSplitAction({
        amount: parseFloat(formData.amount),
        description: formData.description || 'Expense split',
        selectedUserIds: formData.selectedUsers,
        notificationInterval: formData.notificationInterval,
      });

      if (result.success) {
        setOpen(false);
        setFormData({
          amount: '',
          selectedUsers: [],
          notificationInterval: 'weekly',
          description: '',
        });
        setSearchQuery('');
        
        toast.success('Split created successfully!', {
          description: `Created split of $${formData.amount} with ${formData.selectedUsers.length} people.`
        });
      } else {
        toast.error('Failed to create split', {
          description: result.error || 'Please try again.'
        });
      }
    } catch (error) {
      console.error('Error creating split:', error);
      toast.error('Something went wrong', {
        description: 'Please try again later.'
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
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">Add New Split</DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new expense split with your friends and family.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Field */}
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium text-gray-800">
              Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
            </div>
            {formData.amount && formData.selectedUsers.length > 0 && (
              <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                <p>Split between {totalPeople} people: <span className="text-black font-semibold">${amountPerPerson.toFixed(2)} each</span></p>
              </div>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-800">
              Description
            </label>
            <input
              id="description"
              type="text"
              placeholder="What's this expense for?"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* User Search and Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">
              Split with
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            {/* User List */}
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg bg-white">
              {usersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="ml-2 text-sm text-gray-500">Loading users...</span>
                </div>
              ) : filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleUserToggle(user.id)}
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedUsers.includes(user.id)}
                    onChange={() => handleUserToggle(user.id)}
                    className="w-4 h-4 accent-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black">{user.name || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
              {!usersLoading && filteredUsers.length === 0 && (
                <div className="text-center py-6">
                  {searchQuery ? (
                    <p className="text-gray-500">No users found matching "{searchQuery}"</p>
                  ) : users.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-gray-500">No other users available</p>
                      <p className="text-xs text-gray-400">
                        Invite friends to join Paywise to start splitting expenses!
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No users found</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notification Interval */}
          <div className="space-y-2">
            <label htmlFor="notification" className="text-sm font-medium text-gray-800">
              Notification Interval
            </label>
            <div className="relative">
              <Bell className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                id="notification"
                value={formData.notificationInterval}
                onChange={(e) => setFormData(prev => ({ ...prev, notificationInterval: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.amount || formData.selectedUsers.length === 0 || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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