import { Membership, TIER_DISCOUNTS } from './membership.model';
import { IMembership } from './membership.interface';
import { User } from '../users/user.model';
import { MembershipTier } from '../users/user.constant';

export const getMyMembership = async (userId: string): Promise<IMembership> => {
  let membership = await Membership.findOne({ user: userId });
  if (!membership) {
    membership = await Membership.create({ user: userId });
  }
  return membership;
};

// Payment isn't wired up yet (see payments module) — this updates the tier
// directly. Once a real payment provider exists, this should only run after
// a successful charge.
export const updateMyMembership = async (userId: string, tier: MembershipTier): Promise<IMembership> => {
  const membership = await Membership.findOneAndUpdate(
    { user: userId },
    { tier, discountPercent: TIER_DISCOUNTS[tier] ?? 0, status: 'ACTIVE', startDate: new Date() },
    { new: true, upsert: true }
  );

  await User.findByIdAndUpdate(userId, { membershipTier: tier });

  return membership;
};
