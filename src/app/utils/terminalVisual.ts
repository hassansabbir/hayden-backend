import mongoose from 'mongoose';

export const printTerminalDashboard = (port: number, env: string, superAdminStatus?: string): void => {
  const readyStateMap: Record<number, { text: string; color: string }> = {
    0: { text: 'DISCONNECTED', color: '\x1b[31m' }, // Red
    1: { text: 'CONNECTED', color: '\x1b[32m' },    // Green
    2: { text: 'CONNECTING', color: '\x1b[33m' },   // Yellow
    3: { text: 'DISCONNECTING', color: '\x1b[35m' }, // Magenta
  };

  const dbState = readyStateMap[mongoose.connection.readyState] || { text: 'UNKNOWN', color: '\x1b[37m' };

  const superAdminColorMap: Record<string, string> = {
    SEEDED: '\x1b[1;32m',  // Bright Green
    EXISTS: '\x1b[32m',    // Green
    SKIPPED: '\x1b[33m',   // Yellow
    FAILED: '\x1b[31m',    // Red
  };
  const adminColor = superAdminStatus ? (superAdminColorMap[superAdminStatus] || '\x1b[37m') : '\x1b[37m';

  const banner = [
    "   \x1b[32m████████╗███████╗ █████╗     ██╗████████╗    ██╗   ██╗██████╗ \x1b[0m",
    "   \x1b[32m╚══██╔══╝██╔════╝██╔══██╗    ██║╚══██╔══╝    ██║   ██║██╔══██╗\x1b[0m",
    "   \x1b[32m   ██║   █████╗  ███████║    ██║   ██║       ██║   ██║██████╔╝\x1b[0m",
    "   \x1b[32m   ██║   ██╔══╝  ██╔══██║    ██║   ██║       ██║   ██║██╔═══╝ \x1b[0m",
    "   \x1b[32m   ██║   ███████╗██║  ██║    ██║   ██║       ╚██████╔╝██║     \x1b[0m",
    "   \x1b[32m   ╚═╝   ╚══════╝╚═╝  ╚═╝    ╚═╝   ╚═╝        ╚═════╝ ╚═╝     \x1b[0m",
  ].join('\n');

  const width = 64;
  const line = (label: string, value: string, valColor = '\x1b[37m') => {
    const ansiRegex = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
    const cleanLabel = label.replace(ansiRegex, '');
    const cleanValue = value.replace(ansiRegex, '');
    const paddingLength = width - cleanLabel.length - cleanValue.length - 4; // 4 for "║ " and " ║"
    const padding = ' '.repeat(Math.max(0, paddingLength));
    return `\x1b[36m║\x1b[0m ${label}${padding}${valColor}${value}\x1b[0m \x1b[36m║\x1b[0m`;
  };

  const borderTop =    `\x1b[36m╔${'═'.repeat(width - 2)}╗\x1b[0m`;
  const borderDivider = `\x1b[36m╟${'─'.repeat(width - 2)}╢\x1b[0m`;
  const borderBottom =  `\x1b[36m╚${'═'.repeat(width - 2)}╝\x1b[0m`;

  console.log('\n' + banner + '\n');
  console.log(borderTop);
  console.log(line(`\x1b[1mTee-It-Up Backend Service\x1b[0m`, `v1.0.0`, `\x1b[32m`));
  console.log(borderDivider);
  console.log(line(`Status`, `ONLINE`, `\x1b[1;32m`));
  console.log(line(`Environment`, env.toUpperCase(), env === 'production' ? `\x1b[1;31m` : `\x1b[1;33m`));
  console.log(line(`Port`, port.toString(), `\x1b[35m`));
  console.log(line(`Database (MongoDB)`, dbState.text, dbState.color));
  if (superAdminStatus) {
    console.log(line(`Super Admin`, superAdminStatus, adminColor));
  }
  console.log(borderDivider);
  console.log(line(`API Base URL`, `http://localhost:${port}/api/v1`, `\x1b[34m`));
  console.log(line(`Health Endpoint`, `http://localhost:${port}/health`, `\x1b[34m`));
  console.log(line(`Landing Page`, `http://localhost:${port}/`, `\x1b[34m`));
  console.log(borderBottom);
  console.log();
  console.log();
};
