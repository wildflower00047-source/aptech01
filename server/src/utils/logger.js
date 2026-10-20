const colors = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const stamp = () => new Date().toISOString();

const log = (color, label, ...args) => {
  const prefix = `${colors.gray}[${stamp()}]${colors.reset} ${color}${label}${colors.reset}`;
  console.log(prefix, ...args);
};

const logger = {
  info: (...args) => log(colors.cyan, 'INFO ', ...args),
  success: (...args) => log(colors.green, 'OK   ', ...args),
  warn: (...args) => log(colors.yellow, 'WARN ', ...args),
  error: (...args) => log(colors.red, 'ERROR', ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') log(colors.magenta, 'DEBUG', ...args);
  },
  http: (...args) => log(colors.blue, 'HTTP ', ...args),
};

export default logger;
