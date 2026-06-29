import { z } from 'zod';

export const sendContactMessageSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  inquiryType: z.enum(['Membership Inquiry', 'Corporate Event', 'General Question']),
  message: z.string().min(10).max(2000),
});
