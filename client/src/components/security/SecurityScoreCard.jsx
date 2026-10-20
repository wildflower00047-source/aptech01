import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { cn } from '../../lib/utils.js';

const paletteFor = (score) => {
  if (score >= 85) return { text: 'text-emerald-500', stroke: 'stroke-emerald-500', soft: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
  if (score >= 60) return { text: 'text-brand-500', stroke: 'stroke-brand-500', soft: 'bg-brand-500/10 text-brand-600 dark:text-brand-400' };
  if (score >= 40) return { text: 'text-amber-500', stroke: 'stroke-amber-500', soft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
  return { text: 'text-rose-500', stroke: 'stroke-rose-500', soft: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' };
};

export const SecurityScoreCard = ({ security }) => {
  if (!security) return null;
  const { score, grade, level, levelTitle, xp, xpIntoLevel, xpForNext, xpProgressPercent, nextTask, earnedBadges = [] } = security;
  const palette = paletteFor(score);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="grid gap-6 sm:grid-cols-[auto,1fr] sm:items-center">
      <div className="relative mx-auto h-32 w-32">
        <svg viewBox="0 0 80 80" className="h-32 w-32 -rotate-90">
          <circle cx="40" cy="40" r={radius} className="stroke-ink-100 dark:stroke-white/10" strokeWidth="7" fill="none" />
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            className={palette.stroke}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className={cn('text-3xl font-extrabold', palette.text)}>{score}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Grade {grade}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('badge', palette.soft)}>Level {level} · {levelTitle}</span>
          <span className="badge bg-ink-500/10 text-ink-500">{xp} XP</span>
        </div>
        <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
          {nextTask ? <>Next quest: <span className="font-medium text-ink-700 dark:text-ink-200">{nextTask.title}</span></> : 'All security quests complete — you are fully hardened!'}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgressPercent}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <p className="mt-1 text-xs text-ink-400">{xpIntoLevel} / {xpForNext} XP to level {level + 1}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {earnedBadges.map((b) => (
            <span key={b.key} className="inline-flex items-center gap-1 rounded-lg bg-ink-100 px-2 py-1 text-xs font-medium dark:bg-white/5" title={b.label}>
              <span aria-hidden>{b.emoji}</span>
              {b.label}
            </span>
          ))}
          {earnedBadges.length === 0 && <span className="text-xs text-ink-400">No badges yet — complete a quest to earn one.</span>}
        </div>

        <Link to="/security" className="link mt-3 inline-flex items-center gap-1 text-sm">
          Open security center <FiArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};

export default SecurityScoreCard;
