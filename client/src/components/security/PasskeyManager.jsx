import { useState } from 'react';
import toast from 'react-hot-toast';
import { startRegistration } from '@simplewebauthn/browser';
import { FiKey, FiPlus, FiTrash2 } from 'react-icons/fi';
import {
  useGetPasskeysQuery,
  usePasskeyRegisterOptionsMutation,
  usePasskeyRegisterVerifyMutation,
  useDeletePasskeyMutation,
} from '../../api/apiSlice.js';
import { Card, CardHeader } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { extractError, formatRelative } from '../../lib/utils.js';

export const PasskeyManager = () => {
  const { data, isLoading } = useGetPasskeysQuery();
  const [getOptions] = usePasskeyRegisterOptionsMutation();
  const [verify] = usePasskeyRegisterVerifyMutation();
  const [remove] = useDeletePasskeyMutation();
  const [busy, setBusy] = useState(false);

  const passkeys = data?.data?.passkeys || [];

  const addPasskey = async () => {
    if (typeof window.PublicKeyCredential === 'undefined') {
      toast.error('This browser does not support passkeys');
      return;
    }
    setBusy(true);
    try {
      const { data: optData } = await getOptions().unwrap();
      const attResp = await startRegistration(optData.options);
      await verify({ response: attResp }).unwrap();
      toast.success('Passkey added');
    } catch (error) {
      if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
        toast.error('Passkey setup cancelled');
      } else {
        toast.error(extractError(error, 'Could not add passkey'));
      }
    } finally {
      setBusy(false);
    }
  };

  const deletePasskey = async (id) => {
    try {
      await remove(id).unwrap();
      toast.success('Passkey removed');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  return (
    <Card>
      <CardHeader
        title="Passkeys"
        subtitle="Passwordless sign-in with biometrics or a security key"
        icon={FiKey}
        action={
          <Button loading={busy} onClick={addPasskey}>
            <FiPlus /> Add passkey
          </Button>
        }
      />

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-ink-400">Loading passkeys…</p>}
        {passkeys.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/10 text-violet-500">
                <FiKey size={16} />
              </span>
              <div>
                <p className="text-sm font-medium">{p.name || 'Passkey'}</p>
                <p className="text-xs text-ink-400">
                  {p.deviceType || 'device'} · added {formatRelative(p.createdAt)}
                  {p.lastUsedAt ? ` · last used ${formatRelative(p.lastUsedAt)}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {p.backedUp && <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400">Synced</Badge>}
              <Button variant="ghost" className="text-red-500 hover:bg-red-500/10" onClick={() => deletePasskey(p.id)}>
                <FiTrash2 /> Remove
              </Button>
            </div>
          </div>
        ))}
        {!isLoading && passkeys.length === 0 && (
          <p className="text-sm text-ink-400">No passkeys yet. Add one for faster, safer sign-in.</p>
        )}
      </div>
    </Card>
  );
};

export default PasskeyManager;
