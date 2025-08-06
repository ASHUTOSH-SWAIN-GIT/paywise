"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { DollarSign, LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/lib/context/user-context"
import { createRecurringBillAction } from "@/lib/actions/recurring-bills-actions"
import { CurrencyAmountInput } from "@/components/ui/CurrencyAmountInput"

interface AddRecurringBillDialogProps {
  children: React.ReactNode
  onBillAdded?: () => void
}

interface RecurringBillForm {
  description: string
  amount: string
  currency: string
  category: string
  startDate: string
  frequency: string
  paymentLink: string
}

const categories = [
  "Utilities",
  "Rent/Mortgage", 
  "Insurance",
  "Subscriptions",
  "Internet/Phone",
  "Transportation",
  "Healthcare",
  "Entertainment",
  "Food & Groceries",
  "Other"
]

const frequencies = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" }
]

export function AddRecurringBillDialog({ children, onBillAdded }: AddRecurringBillDialogProps) {
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<RecurringBillForm>({
    description: "",
    amount: "",
    currency: "INR", // Default to Indian Rupee
    category: "",
    startDate: "",
    frequency: "",
    paymentLink: ""
  })

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      currency: "INR",
      category: "",
      startDate: "",
      frequency: "",
      paymentLink: ""
    })
  }

  const handleInputChange = (field: keyof RecurringBillForm, value: string) => {
    if (field === 'startDate') {
      console.log('Date selected:', value) // Debug log for date
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.description.trim()) {
      toast.error("Please enter a description")
      return
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    
    if (!formData.category) {
      toast.error("Please select a category")
      return
    }
    
    if (!formData.startDate) {
      toast.error("Please select a start date")
      return
    }
    
    if (!formData.frequency) {
      toast.error("Please select a frequency")
      return
    }

    // Validate payment link if provided
    if (formData.paymentLink && !isValidUrl(formData.paymentLink)) {
      toast.error("Please enter a valid payment link URL")
      return
    }

    // Check if user is available
    if (!user?.id) {
      toast.error("User not authenticated")
      return
    }

    setIsLoading(true)
    
    try {
      const result = await createRecurringBillAction({
        description: formData.description,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        startDate: formData.startDate,
        frequency: formData.frequency,
        paymentLink: formData.paymentLink || undefined,
        userId: user.id
      })

      if (result.success) {
        toast.success("Recurring bill added successfully!")
        resetForm()
        setIsOpen(false)
        onBillAdded?.() // Call the callback to refresh the list
      } else {
        toast.error(result.error || "Failed to add recurring bill")
      }
    } catch (error) {
      console.error("Error creating recurring bill:", error)
      toast.error("Failed to add recurring bill")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    const number = parseFloat(value)
    if (isNaN(number)) return ""
    return number.toFixed(2)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-black border border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">Add Recurring Bill</DialogTitle>
          <DialogDescription className="text-slate-400">
            Set up a new recurring payment to track your regular expenses.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-200">
              Description *
            </Label>
            <Input
              id="description"
              placeholder="e.g., Netflix Subscription, Electricity Bill"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="bg-black border-slate-800 text-white placeholder:text-slate-500 focus:border-white"
              disabled={isLoading}
            />
          </div>

          {/* Amount with Currency */}
          <CurrencyAmountInput
            id="amount"
            label="Amount"
            amount={formData.amount}
            currency={formData.currency}
            onAmountChange={(value) => handleInputChange("amount", value)}
            onCurrencyChange={(value) => handleInputChange("currency", value)}
            placeholder="0.00"
            required={true}
            disabled={isLoading}
            className="bg-neutral-900"
          />

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-slate-200">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-slate-200">
              Start Date *
            </Label>
            <div className="relative">
              <input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                onClick={(e) => {
                  e.currentTarget.showPicker?.()
                }}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-black px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                disabled={isLoading}
                min={new Date().toISOString().split('T')[0]}
                required
                style={{
                  colorScheme: 'dark'
                }}
              />
              {!formData.startDate && (
                <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                  <span className="text-slate-500 text-sm">Select a date</span>
                </div>
              )}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-slate-200">Frequency *</Label>
            <Select value={formData.frequency} onValueChange={(value) => handleInputChange("frequency", value)}>
              <SelectTrigger>
                <SelectValue placeholder="How often?" />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Link */}
          <div className="space-y-2">
            <Label htmlFor="paymentLink" className="text-slate-200">
              Payment Link
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="paymentLink"
                type="url"
                placeholder="https://example.com/payment"
                value={formData.paymentLink}
                onChange={(e) => handleInputChange("paymentLink", e.target.value)}
                className="bg-black border-slate-800 text-white placeholder:text-slate-500 focus:border-white pl-10"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-slate-500">
              Optional: Add a direct payment link to include in notification emails
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-white text-black hover:bg-slate-200"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Recurring Bill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
