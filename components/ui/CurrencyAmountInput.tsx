'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
];

interface CurrencyAmountInputProps {
  id?: string;
  label?: string;
  amount: string;
  currency: string;
  onAmountChange: (amount: string) => void;
  onCurrencyChange: (currency: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function CurrencyAmountInput({
  id = 'amount',
  label = 'Amount',
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  placeholder = '0.00',
  required = false,
  disabled = false,
  error,
  className = ''
}: CurrencyAmountInputProps) {
  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-slate-200">
          {label} {required && '*'}
        </Label>
      )}
      <div className="flex gap-2">
        {/* Currency Selector */}
        <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger className="w-[120px] bg-black border-slate-800 text-white focus:border-white">
              <SelectValue placeholder={`${selectedCurrency.symbol} ${selectedCurrency.code}`} />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem 
                  key={curr.code} 
                  value={curr.code}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold w-6">{curr.symbol}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{curr.code}</span>
                      <span className="text-xs text-slate-400">{curr.name}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-lg">
            {selectedCurrency.symbol}
          </span>
          <Input
            id={id}
            type="number"
            step="0.01"
            min="0"
            placeholder={placeholder}
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="bg-black border-slate-800 text-white placeholder:text-slate-500 focus:border-white pl-10"
            disabled={disabled}
            required={required}
          />
        </div>
      </div>
      
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}

// Utility function to format currency
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  
  // For some currencies, we want different formatting
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
  };

  try {
    return new Intl.NumberFormat('en-US', options).format(amount);
  } catch {
    // Fallback if currency is not supported by Intl.NumberFormat
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
}

// Utility function to get currency symbol
export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || '$';
}
