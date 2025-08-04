'use server';

import { prisma } from '@/lib/prisma/prisma';
import { EmailService } from '@/lib/services/EmailService';

// Helper function to calculate next due date
function calculateNextDueDate(startDate: Date, frequency: string): Date {
  const date = new Date(startDate);
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      // Default to monthly if frequency is invalid
      date.setMonth(date.getMonth() + 1);
  }
  
  return date;
}

interface CreateRecurringBillData {
  description: string;
  amount: number;
  category: string;
  startDate: string;
  frequency: string;
  paymentLink?: string;
  userId: string;
}

export async function createRecurringBillAction(data: CreateRecurringBillData) {
  try {
    // Validate required fields
    if (!data.description || !data.amount || !data.category || !data.startDate || !data.frequency || !data.userId) {
      return { success: false, error: 'Missing required fields' };
    }

    // Validate amount
    if (data.amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    // Validate frequency
    const validFrequencies = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
    if (!validFrequencies.includes(data.frequency)) {
      return { success: false, error: 'Invalid frequency' };
    }

    // Create the recurring bill
    const recurringBill = await prisma.reccuringPayments.create({
      data: {
        description: data.description.trim(),
        amount: parseFloat(data.amount.toString()),
        category: data.category,
        startDate: new Date(data.startDate),
        frequency: data.frequency,
        paymentLink: data.paymentLink?.trim() || null,
        userId: data.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    console.log('Recurring bill created successfully:', recurringBill.id);

    // Send confirmation email
    try {
      const nextDueDate = calculateNextDueDate(recurringBill.startDate, recurringBill.frequency);
      
      await EmailService.sendRecurringPaymentCreated({
        email: recurringBill.user.email,
        userName: recurringBill.user.name || 'User',
        description: recurringBill.description,
        amount: recurringBill.amount,
        frequency: recurringBill.frequency,
        category: recurringBill.category,
        firstPaymentDate: recurringBill.startDate.toLocaleDateString(),
        nextDueDate: nextDueDate.toLocaleDateString(),
      });
      
      console.log('Confirmation email sent for recurring bill:', recurringBill.id);
    } catch (emailError) {
      // Log email error but don't fail the creation
      console.error('Failed to send confirmation email:', emailError);
    }

    return { success: true, recurringBill };

  } catch (error) {
    console.error('Error creating recurring bill:', error);
    return { success: false, error: 'Failed to create recurring bill' };
  }
}

export async function getUserRecurringBillsAction(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const recurringBills = await prisma.reccuringPayments.findMany({
      where: {
        userId: userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { success: true, recurringBills };

  } catch (error) {
    console.error('Error fetching recurring bills:', error);
    return { success: false, error: 'Failed to fetch recurring bills' };
  }
}

export async function deleteRecurringBillAction(billId: string, userId: string) {
  try {
    if (!billId || !userId) {
      return { success: false, error: 'Bill ID and User ID are required' };
    }

    // Check if the bill belongs to the user
    const bill = await prisma.reccuringPayments.findFirst({
      where: {
        id: billId,
        userId: userId
      }
    });

    if (!bill) {
      return { success: false, error: 'Recurring bill not found or access denied' };
    }

    // Delete the bill
    await prisma.reccuringPayments.delete({
      where: {
        id: billId
      }
    });

    console.log('Recurring bill deleted successfully:', billId);
    return { success: true };

  } catch (error) {
    console.error('Error deleting recurring bill:', error);
    return { success: false, error: 'Failed to delete recurring bill' };
  }
}

export async function updateRecurringBillAction(billId: string, userId: string, data: Partial<CreateRecurringBillData>) {
  try {
    if (!billId || !userId) {
      return { success: false, error: 'Bill ID and User ID are required' };
    }

    // Check if the bill belongs to the user
    const existingBill = await prisma.reccuringPayments.findFirst({
      where: {
        id: billId,
        userId: userId
      }
    });

    if (!existingBill) {
      return { success: false, error: 'Recurring bill not found or access denied' };
    }

    // Prepare update data
    const updateData: any = {};
    
    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }
    
    if (data.amount !== undefined) {
      if (data.amount <= 0) {
        return { success: false, error: 'Amount must be greater than 0' };
      }
      updateData.amount = parseFloat(data.amount.toString());
    }
    
    if (data.category !== undefined) {
      updateData.category = data.category;
    }
    
    if (data.startDate !== undefined) {
      updateData.startDate = new Date(data.startDate);
    }
    
    if (data.frequency !== undefined) {
      const validFrequencies = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
      if (!validFrequencies.includes(data.frequency)) {
        return { success: false, error: 'Invalid frequency' };
      }
      updateData.frequency = data.frequency;
    }
    
    if (data.paymentLink !== undefined) {
      updateData.paymentLink = data.paymentLink?.trim() || null;
    }

    // Update the bill
    const updatedBill = await prisma.reccuringPayments.update({
      where: {
        id: billId
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    console.log('Recurring bill updated successfully:', billId);
    return { success: true, recurringBill: updatedBill };

  } catch (error) {
    console.error('Error updating recurring bill:', error);
    return { success: false, error: 'Failed to update recurring bill' };
  }
}
