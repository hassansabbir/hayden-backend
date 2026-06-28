import { User } from '../modules/users/user.model';
import { ROLE } from '../modules/users/user.constant';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const seedSuperAdmin = async (): Promise<string> => {
  try {
    const email = env.SUPER_ADMIN_EMAIL;
    const password = env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      logger.warn('Super Admin seeding skipped: credentials not found in env.');
      return 'SKIPPED';
    }

    // Check if a super admin already exists by role or email
    const existingSuperAdmin = await User.findOne({
      $or: [
        { role: ROLE.SUPER_ADMIN },
        { email: email.toLowerCase() },
      ],
    });

    if (existingSuperAdmin) {
      logger.info('Super Admin already exists. Seeding skipped.');
      return 'EXISTS';
    }

    // Create a new super admin user
    const superAdmin = new User({
      fullName: 'Super Admin',
      email: email.toLowerCase(),
      passwordHash: password, // Hashes automatically via mongoose pre-save hook
      role: ROLE.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    await superAdmin.save();
    logger.info(`Super Admin user seeded successfully with email: ${email}`);
    return 'SEEDED';
  } catch (error) {
    logger.error('Failed to seed Super Admin user', { error });
    return 'FAILED';
  }
};
