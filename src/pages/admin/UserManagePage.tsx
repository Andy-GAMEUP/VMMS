import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllUsers,
  approveUser,
  rejectUser,
  disableUser,
  enableUser,
  fetchUserMachines,
  setUserMachines,
  type AdminUser,
} from '@/api/admin';
import { useMachines } from '@/hooks/useMachines';
import { useT } from '@/i18n/useT';

type FilterKey = 'all' | 'pending' | 'active' | 'disabled';

export default function UserManagePage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showMachineModal, setShowMachineModal] = useState(false);

  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t.common.all },
    { key: 'pending', label: t.admin.pending },
    { key: 'active', label: t.admin.active },
    { key: 'disabled', label: t.admin.inactive },
  ];

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchAllUsers,
  });

  const filtered = users.filter((u) => {
    if (filter === 'all') return true;
    return u.status === filter;
  });

  const counts = users.reduce(
    (acc, u) => {
      acc[u.status] = (acc[u.status] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    },
    { all: 0, pending: 0, active: 0, disabled: 0 } as Record<string, number>,
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const approveMut = useMutation({ mutationFn: approveUser, onSuccess: invalidate });
  const rejectMut = useMutation({ mutationFn: (userId: string) => rejectUser(userId), onSuccess: invalidate });
  const disableMut = useMutation({ mutationFn: disableUser, onSuccess: invalidate });
  const enableMut = useMutation({ mutationFn: enableUser, onSuccess: invalidate });

  return (
    <div className="space-y-sp-4 py-sp-4">
      <h2 className="text-heading" style={{ color: 'var(--c-tx1)' }}>{t.admin.userManagement}</h2>

      <div className="flex gap-sp-2 overflow-x-auto pb-1 -mx-sp-4 px-sp-4">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className="px-3 py-1.5 rounded-badge text-caption whitespace-nowrap transition-colors touch-target"
            style={{
              backgroundColor: filter === opt.key ? 'var(--c-pri)' : 'var(--c-bd2)',
              color: filter === opt.key ? '#fff' : 'var(--c-tx2)',
            }}
          >
            {opt.label} {counts[opt.key] ?? 0}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-sp-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-24 animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-body" style={{ color: 'var(--c-tx3)' }}>
          {t.admin.noUsers}
        </div>
      ) : (
        <div className="space-y-sp-2">
          {filtered.map((user) => (
            <div key={user.id} className="card">
              <div className="flex items-start gap-sp-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                  style={{
                    backgroundColor:
                      user.status === 'disabled' ? 'var(--c-tx3)'
                      : user.status === 'pending' ? 'var(--c-warn)'
                      : user.role === 'admin' ? 'var(--c-pri)'
                      : 'var(--c-ok)',
                  }}
                >
                  {user.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-sp-2 flex-wrap">
                    <p className="text-title" style={{ color: 'var(--c-tx1)' }}>{user.name}</p>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor: user.role === 'admin' ? 'var(--c-pri-lt)' : 'var(--c-bd2)',
                        color: user.role === 'admin' ? 'var(--c-pri)' : 'var(--c-tx2)',
                      }}
                    >
                      {user.role === 'admin' ? t.roles.admin : t.roles.manager}
                    </span>
                    {user.role !== 'admin' && user.accountType && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: 'var(--c-pri-lt)',
                          color: 'var(--c-pri)',
                        }}
                      >
                        {user.accountType === 'business' ? t.admin.business : 'Sub Admin'}
                      </span>
                    )}
                  </div>
                  <p className="text-caption truncate" style={{ color: 'var(--c-tx2)' }}>{user.email}</p>
                  <p className="text-meta" style={{ color: 'var(--c-tx3)' }}>
                    {user.phone} · {user.deptName}
                    {user.accountType === 'business' && user.businessName && (
                      <> · <span style={{ color: 'var(--c-pri)' }}>{user.businessName}</span></>
                    )}
                  </p>
                </div>

                <span
                  className="px-2 py-1 rounded-badge text-[11px] font-medium whitespace-nowrap"
                  style={{
                    backgroundColor:
                      user.status === 'active' ? 'color-mix(in srgb, var(--c-ok) 12%, transparent)'
                      : user.status === 'pending' ? 'color-mix(in srgb, var(--c-warn) 12%, transparent)'
                      : 'var(--c-bd2)',
                    color:
                      user.status === 'active' ? 'var(--c-ok)'
                      : user.status === 'pending' ? 'var(--c-warn)'
                      : 'var(--c-tx3)',
                  }}
                >
                  {user.status === 'active' ? t.admin.active : user.status === 'pending' ? t.admin.pendingBadge : t.admin.inactive}
                </span>
              </div>

              {user.role !== 'admin' && (
                <div className="flex gap-sp-2 mt-sp-3 pt-sp-3" style={{ borderTop: '1px solid var(--c-bd2)' }}>
                  {user.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approveMut.mutate(user.id)}
                        disabled={approveMut.isPending}
                        className="flex-1 h-9 text-white text-caption rounded-button disabled:opacity-50"
                        style={{ backgroundColor: 'var(--c-ok)' }}
                      >
                        {t.admin.approve}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t.admin.confirmReject)) rejectMut.mutate(user.id);
                        }}
                        disabled={rejectMut.isPending}
                        className="flex-1 h-9 text-white text-caption rounded-button disabled:opacity-50"
                        style={{ backgroundColor: 'var(--c-err)' }}
                      >
                        {t.admin.reject}
                      </button>
                    </>
                  )}
                  {user.status === 'active' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowMachineModal(true);
                        }}
                        className="flex-1 h-9 text-white text-caption rounded-button"
                        style={{ backgroundColor: 'var(--c-pri)' }}
                      >
                        {t.admin.assignMachines}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t.admin.confirmDeactivate(user.name))) disableMut.mutate(user.id);
                        }}
                        disabled={disableMut.isPending}
                        className="h-9 px-3 text-caption rounded-button disabled:opacity-50"
                        style={{ border: '1px solid var(--c-bd)', color: 'var(--c-tx2)' }}
                      >
                        {t.admin.deactivate}
                      </button>
                    </>
                  )}
                  {user.status === 'disabled' && (
                    <button
                      onClick={() => enableMut.mutate(user.id)}
                      disabled={enableMut.isPending}
                      className="flex-1 h-9 text-caption rounded-button disabled:opacity-50"
                      style={{ border: '1px solid var(--c-pri)', color: 'var(--c-pri)' }}
                    >
                      {t.admin.reactivate}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showMachineModal && selectedUser && (
        <MachineAssignModal
          user={selectedUser}
          onClose={() => {
            setShowMachineModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

function MachineAssignModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: machines = [] } = useMachines();
  const { data: assignedIds = [], isLoading } = useQuery({
    queryKey: ['admin', 'users', user.id, 'machines'],
    queryFn: () => fetchUserMachines(user.id),
  });

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  if (!initialized && !isLoading && assignedIds.length >= 0) {
    setSelected(new Set(assignedIds));
    setInitialized(true);
  }

  const saveMut = useMutation({
    mutationFn: () => setUserMachines(user.id, [...selected]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      onClose();
    },
  });

  const toggle = (funId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(funId)) next.delete(funId);
      else next.add(funId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === machines.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(machines.map((m) => m.funId)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl max-h-[80vh] flex flex-col"
        style={{ backgroundColor: 'var(--c-sf)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-sp-4 py-sp-4" style={{ borderBottom: '1px solid var(--c-bd)' }}>
          <div>
            <h3 className="text-heading" style={{ color: 'var(--c-tx1)' }}>{t.admin.assignMachines}</h3>
            <p className="text-caption" style={{ color: 'var(--c-tx2)' }}>{user.name} ({user.email})</p>
          </div>
          <button onClick={onClose} className="touch-target" style={{ color: 'var(--c-tx3)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-sp-4 py-sp-3" style={{ borderBottom: '1px solid var(--c-bd2)' }}>
          <label className="flex items-center gap-sp-3 cursor-pointer">
            <input
              type="checkbox"
              checked={machines.length > 0 && selected.size === machines.length}
              onChange={toggleAll}
              className="w-[18px] h-[18px] rounded"
              style={{ accentColor: 'var(--c-pri)' }}
            />
            <span className="text-title" style={{ color: 'var(--c-tx1)' }}>{t.admin.selectAll} ({selected.size}/{machines.length})</span>
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-sp-4 py-sp-2">
          {isLoading ? (
            <div className="py-10 text-center text-body" style={{ color: 'var(--c-tx3)' }}>{t.common.loading}</div>
          ) : machines.length === 0 ? (
            <div className="py-10 text-center text-body" style={{ color: 'var(--c-tx3)' }}>{t.admin.noMachines}</div>
          ) : (
            <div className="space-y-sp-1">
              {machines.map((m) => (
                <label
                  key={m.funId}
                  className="flex items-center gap-sp-3 px-sp-3 py-sp-3 rounded-lg cursor-pointer transition-colors"
                  style={{ backgroundColor: selected.has(m.funId) ? 'var(--c-pri-lt)' : 'transparent' }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(m.funId)}
                    onChange={() => toggle(m.funId)}
                    className="w-[18px] h-[18px] rounded"
                    style={{ accentColor: 'var(--c-pri)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-title truncate" style={{ color: 'var(--c-tx1)' }}>{m.funName}</p>
                    <p className="text-caption truncate" style={{ color: 'var(--c-tx2)' }}>{m.address}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="px-sp-4 py-sp-4 flex gap-sp-3" style={{ borderTop: '1px solid var(--c-bd)' }}>
          <button
            onClick={onClose}
            className="flex-1 h-12 font-semibold rounded-button"
            style={{ border: '1px solid var(--c-bd)', color: 'var(--c-tx1)' }}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="flex-1 h-12 text-white font-semibold rounded-button disabled:opacity-50"
            style={{ backgroundColor: 'var(--c-pri)' }}
          >
            {saveMut.isPending ? t.admin.saving : `${t.common.save} (${selected.size}${t.common.units})`}
          </button>
        </div>
      </div>
    </div>
  );
}
