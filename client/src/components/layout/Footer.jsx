import { FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';
import { Logo } from './Logo.jsx';

export const Footer = () => (
  <footer className="border-t border-ink-200/70 bg-white/60 dark:border-white/10 dark:bg-ink-950/60">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="text-sm text-ink-400">© {new Date().getFullYear()} AuthSec</span>
      </div>
      <div className="flex items-center gap-4 text-ink-400">
        <a href="https://github.com" className="transition hover:text-brand-500" aria-label="GitHub">
          <FiGithub size={18} />
        </a>
        <a href="https://twitter.com" className="transition hover:text-brand-500" aria-label="Twitter">
          <FiTwitter size={18} />
        </a>
        <a href="https://linkedin.com" className="transition hover:text-brand-500" aria-label="LinkedIn">
          <FiLinkedin size={18} />
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
