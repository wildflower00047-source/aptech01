import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiCircle, FiAward, FiBell, FiRefreshCw, FiZap } from 'react-icons/fi';
import {
  useClaimQuestMutation,
  useUpdateLoginAlertsMutation,
  useRegenerateRecoveryCodesMutation,
} from '../../api/apiSlice.js';
import { Card, CardHeader } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { cn, extractError } from '../../lib/utils.js';

export const SecurityQuests = ({ security, onRecoveryCodes }) => {
  const [claim, { isLoading: claiming }] = useClaimQuestMutation();
  const [toggleAlerts, { isLoading: togglingAlerts }] = useUpdateLoginAlertsMutation();
  const [regenerate, { isLoading: regenerating }] = useRegenerateRecoveryCodesMutation();

  if (!security) return null;

  const { tasks = [], score, grade, completedCount = 0, totalCount = 0 } = security;
  const alertsTask = tasks.find((t) => t.key === 'enable_login_alerts');
  const alertsOn = Boolean(alertsTask?.done);

  const claimQuest = async (key) => {
    try {
      await claim(key).unwrap();
      toast.success('Quest complete! XP earned');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const onToggleAlerts = async (enabled) => {
    try {
      await toggleAlerts(enabled).unwrap();
      toast.success(enabled ? 'Login alerts enabled' : 'Login alerts disabled');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const onRegenerate = async () => {
    try {
      const res = await regenerate().unwrap();
      onRecoveryCodes?.(res.data.recoveryCodes);
      toast.success('New recovery codes generated');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  return (
    <Card>
      <CardHeader
        title="Security quests"
        subtitle={`${completedCount} of ${totalCount} complete · score ${score}/100 (${grade})`}
        icon={FiAward}
        action={
          <span className="badge bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <FiZap size={12} /> {security.xp} XP
          </span>
        }
      />

      <div className="space-y-2">
        {tasks.map((task) => (
          <motion.div
            key={task.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5',
              task.done ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-ink-100 dark:border-white/5',
            )}
          >
            <div className="flex items-start gap-3">
              {task.done ? (
                <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-500" />
              ) : (
                <FiCircle className="mt-0.5 shrink-0 text-ink-300 dark:text-ink-600" />
              )}
              <div>
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-ink-400">{task.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge bg-ink-500/10 text-ink-500">+{task.xp} XP</span>
              {task.key === 'save_recovery_codes' && task.done && (
                <Button variant="ghost" loading={regenerating} onClick={onRegenerate}>
                  <FiRefreshCw size={14} /> Regenerate
                </Button>
              )}
              {task.claimable && task.done && !task.claimed && (
                <Button variant="secondary" loading={claiming} onClick={() => claimQuest(task.key)}>
                  Claim
                </Button>
              )}
              {task.claimable && task.claimed && (
                <span className="text-xs font-semibold text-emerald-500">Claimed</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/10 text-brand-500">
            <FiBell size={16} />
          </span>
          <div>
            <p className="text-sm font-medium">Login alerts</p>
            <p className="text-xs text-ink-400">Email me on every new sign-in.</p>
          </div>
        </div>
        <Button
          variant={alertsOn ? 'secondary' : 'primary'}
          loading={togglingAlerts}
          onClick={() => onToggleAlerts(!alertsOn)}
        >
          {alertsOn ? 'Disable' : 'Enable'}
        </Button>
      </div>
    </Card>
  );
};

export default SecurityQuests;
