import crypto from 'crypto';

// Human-readable booking reference, e.g. "MCG-88291-ZX", used for the public
// guest-lookup endpoint where players track a booking by email + this id.
export const generateBookingId = (): string => {
  const digits = crypto.randomInt(10000, 99999);
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TIU-${digits}-${suffix}`;
};
