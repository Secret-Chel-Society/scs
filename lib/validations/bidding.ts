import { z } from 'zod';

// Base bid schema
export const bidIdSchema = z.string().uuid('Invalid bid ID format');

export const processBidWinnerSchema = z.object({
  bidId: z.string().uuid('Invalid bid ID format'),
  winnerId: z.string().uuid('Invalid winner ID format'),
  winningAmount: z.number().int().positive('Winning amount must be a positive number'),
});

export const extendBidSchema = z.object({
  bidId: z.string().uuid('Invalid bid ID format'),
  hoursToAdd: z.number().int().min(1, 'Must add at least 1 hour').max(168, 'Cannot extend more than 1 week')
});

export const cancelBidSchema = z.object({
  bidId: z.string().uuid('Invalid bid ID format')
});

// Type exports
export type ProcessBidWinnerInput = z.infer<typeof processBidWinnerSchema>;
export type ExtendBidInput = z.infer<typeof extendBidSchema>;
export type CancelBidInput = z.infer<typeof cancelBidSchema>;
