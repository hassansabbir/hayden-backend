import app from '../src/app';
import { connectDB } from '../src/app/config/database';
import { seedSuperAdmin } from '../src/app/utils/seedSuperAdmin';

// Runs once per cold start; subsequent warm invocations await an already-resolved promise.
const ready = connectDB().then(() => seedSuperAdmin());

export default async function handler(req: any, res: any): Promise<void> {
  await ready;
  app(req, res);
}
