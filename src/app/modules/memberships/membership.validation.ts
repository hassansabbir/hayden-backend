import { z } from 'zod';
import { MEMBERSHIP_TIER } from '../users/user.constant';

export const updateMembershipSchema = z.object({
  tier: z.enum([MEMBERSHIP_TIER.STANDARD, MEMBERSHIP_TIER.PREMIUM, MEMBERSHIP_TIER.ELITE]),
});
