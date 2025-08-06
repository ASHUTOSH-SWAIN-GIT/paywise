'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createExpenseAction } from '@/lib/actions/expense-actions';
import { CurrencyAmountInput } from '@/components/ui/CurrencyAmountInput';

interface AddExpenseDialogProps {
  children: React.ReactNode;
  onExpenseAdded?: () => void;
}

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Personal Care',
  'Healthcare',
  'Education',
  'Travel',
  'Coffee & Snacks',
  'Gas & Fuel',
  'Clothing',
  'Fitness & Sports',
  'Hobbies',
  'Gifts',
  'Other'
];

export function AddExpenseDialog({ children, onExpenseAdded }: AddExpenseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'INR', // Default to Indian Rupee
    category: '',
    receiptUrl: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a valid number greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await createExpenseAction({
        description: formData.description,
        amount: Number(formData.amount),
        currency: formData.currency,
        category: formData.category,
        receiptUrl: formData.receiptUrl || undefined,
      });

      if (result.success) {
        console.log('Expense created successfully');
        setFormData({
          description: '',
          amount: '',
          currency: 'INR',
          category: '',
          receiptUrl: ''
        });
        setIsOpen(false);
        onExpenseAdded?.();
      } else {
        setErrors({ submit: result.error || 'Failed to create expense' });
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white">Add Personal Expense</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Track your personal day-to-day spending and expenses.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description *
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="e.g., Lunch at restaurant"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
            {errors.description && (
              <p className="text-red-400 text-sm">{errors.description}</p>
            )}
          </div>

          {/* Amount Field with Currency */}
          <CurrencyAmountInput
            id="amount"
            label="Amount"
            amount={formData.amount}
            currency={formData.currency}
            onAmountChange={(value) => handleInputChange('amount', value)}
            onCurrencyChange={(value) => handleInputChange('currency', value)}
            placeholder="0.00"
            required={true}
            error={errors.amount}
            className="bg-neutral-900"
          />

          {/* Category Field */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-white">
              Category *
            </Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem 
                    key={category} 
                    value={category}
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-red-400 text-sm">{errors.category}</p>
            )}
          </div>

          {/* Receipt URL Field (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="receiptUrl" className="text-white">
              Receipt URL (Optional)
            </Label>
            <Input
              id="receiptUrl"
              type="url"
              placeholder="https://example.com/receipt.jpg"
              value={formData.receiptUrl}
              onChange={(e) => handleInputChange('receiptUrl', e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
            <p className="text-neutral-500 text-xs">
              Add a link to your receipt image for better expense tracking
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-900/50 border border-red-800 rounded-md">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
