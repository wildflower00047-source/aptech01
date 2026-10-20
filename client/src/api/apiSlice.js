import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../app/baseQuery.js';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Me', 'Users', 'User', 'Sessions', 'Audit', 'Stats', 'Security', 'Passkeys', 'Threats', 'Rbac', 'Settings'],
  keepUnusedDataFor: 60,
  endpoints: (builder) => ({
    // ---- Auth ----
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', data: body }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', data: body }),
      invalidatesTags: ['Me'],
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Me'],
    }),
    logoutAll: builder.mutation({
      query: () => ({ url: '/auth/logout-all', method: 'POST' }),
      invalidatesTags: ['Me', 'Sessions'],
    }),
    getMe: builder.query({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['Me'],
    }),
    verifyEmail: builder.query({
      query: (token) => ({ url: '/auth/verify-email', params: { token } }),
    }),
    resendVerification: builder.mutation({
      query: (body) => ({ url: '/auth/resend-verification', method: 'POST', data: body }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', data: body }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', data: body }),
    }),
    changePassword: builder.mutation({
      query: (body) => ({ url: '/auth/change-password', method: 'PATCH', data: body }),
    }),

    // ---- 2FA ----
    setupTwoFactor: builder.mutation({
      query: () => ({ url: '/auth/2fa/setup', method: 'POST' }),
    }),
    verifyTwoFactor: builder.mutation({
      query: (body) => ({ url: '/auth/2fa/verify', method: 'POST', data: body }),
      invalidatesTags: ['Me'],
    }),
    disableTwoFactor: builder.mutation({
      query: (body) => ({ url: '/auth/2fa/disable', method: 'POST', data: body }),
      invalidatesTags: ['Me'],
    }),

    // ---- Sessions ----
    getSessions: builder.query({
      query: () => ({ url: '/auth/sessions' }),
      providesTags: ['Sessions'],
    }),
    revokeSession: builder.mutation({
      query: (id) => ({ url: `/auth/sessions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Sessions'],
    }),

    // ---- Profile ----
    getProfile: builder.query({
      query: () => ({ url: '/users/profile' }),
      providesTags: ['Me'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({ url: '/users/profile', method: 'PATCH', data: body }),
      invalidatesTags: ['Me'],
    }),
    deleteAccount: builder.mutation({
      query: (body) => ({ url: '/users/profile', method: 'DELETE', data: body }),
      invalidatesTags: ['Me'],
    }),

    // ---- Admin: users ----
    getUsers: builder.query({
      query: (params = {}) => ({ url: '/admin/users', params }),
      providesTags: (result) =>
        result?.data?.users
          ? [...result.data.users.map((u) => ({ type: 'User', id: u.id })), { type: 'Users', id: 'LIST' }]
          : [{ type: 'Users', id: 'LIST' }],
    }),
    getUser: builder.query({
      query: (id) => ({ url: `/admin/users/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: '/admin/users', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }, 'Stats'],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({ url: `/admin/users/${id}/role`, method: 'PATCH', data: { role } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, { type: 'Users', id: 'LIST' }, 'Stats'],
    }),
    updateUserStatus: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}/status`, method: 'PATCH', data: body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, { type: 'Users', id: 'LIST' }, 'Stats'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }, 'Stats'],
    }),

    // ---- Admin: stats & audit ----
    getStats: builder.query({
      query: () => ({ url: '/admin/stats' }),
      providesTags: ['Stats'],
    }),
    getAuditLogs: builder.query({
      query: (params = {}) => ({ url: '/admin/audit-logs', params }),
      providesTags: ['Audit'],
    }),
    getRbacMeta: builder.query({
      query: () => ({ url: '/meta/rbac' }),
    }),

    // ---- Security center & gamified quests ----
    getSecurity: builder.query({
      query: () => ({ url: '/security' }),
      providesTags: ['Security'],
    }),
    claimQuest: builder.mutation({
      query: (key) => ({ url: `/security/quests/${key}/claim`, method: 'POST' }),
      invalidatesTags: ['Security', 'Me'],
    }),
    updateLoginAlerts: builder.mutation({
      query: (enabled) => ({ url: '/security/login-alerts', method: 'PATCH', data: { enabled } }),
      invalidatesTags: ['Security'],
    }),
    regenerateRecoveryCodes: builder.mutation({
      query: () => ({ url: '/security/recovery-codes/regenerate', method: 'POST' }),
      invalidatesTags: ['Security'],
    }),

    // ---- Passkeys (WebAuthn) ----
    getPasskeys: builder.query({
      query: () => ({ url: '/auth/passkeys' }),
      providesTags: ['Passkeys'],
    }),
    passkeyRegisterOptions: builder.mutation({
      query: () => ({ url: '/auth/passkeys/register/options', method: 'POST' }),
    }),
    passkeyRegisterVerify: builder.mutation({
      query: (body) => ({ url: '/auth/passkeys/register/verify', method: 'POST', data: body }),
      invalidatesTags: ['Passkeys', 'Security'],
    }),
    deletePasskey: builder.mutation({
      query: (id) => ({ url: `/auth/passkeys/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Passkeys', 'Security'],
    }),
    passkeyLoginOptions: builder.mutation({
      query: (body) => ({ url: '/auth/passkey/login/options', method: 'POST', data: body }),
    }),
    passkeyLoginVerify: builder.mutation({
      query: (body) => ({ url: '/auth/passkey/login/verify', method: 'POST', data: body }),
      invalidatesTags: ['Me'],
    }),

    // ---- Admin: threat feed, RBAC, settings ----
    getThreats: builder.query({
      query: (params = {}) => ({ url: '/admin/threats', params }),
      providesTags: ['Threats'],
    }),
    getRbac: builder.query({
      query: () => ({ url: '/admin/rbac' }),
      providesTags: ['Rbac'],
    }),
    updateRolePermissions: builder.mutation({
      query: ({ role, permissions }) => ({ url: `/admin/rbac/${role}`, method: 'PATCH', data: { permissions } }),
      invalidatesTags: ['Rbac', 'Me'],
    }),
    resetRolePermissions: builder.mutation({
      query: (role) => ({ url: `/admin/rbac/${role}/reset`, method: 'POST' }),
      invalidatesTags: ['Rbac', 'Me'],
    }),
    getSettings: builder.query({
      query: () => ({ url: '/admin/settings' }),
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation({
      query: (body) => ({ url: '/admin/settings', method: 'PATCH', data: body }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useGetMeQuery,
  useVerifyEmailQuery,
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useSetupTwoFactorMutation,
  useVerifyTwoFactorMutation,
  useDisableTwoFactorMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteAccountMutation,
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useGetStatsQuery,
  useGetAuditLogsQuery,
  useGetRbacMetaQuery,
  useGetSecurityQuery,
  useClaimQuestMutation,
  useUpdateLoginAlertsMutation,
  useRegenerateRecoveryCodesMutation,
  useGetPasskeysQuery,
  usePasskeyRegisterOptionsMutation,
  usePasskeyRegisterVerifyMutation,
  useDeletePasskeyMutation,
  usePasskeyLoginOptionsMutation,
  usePasskeyLoginVerifyMutation,
  useGetThreatsQuery,
  useGetRbacQuery,
  useUpdateRolePermissionsMutation,
  useResetRolePermissionsMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} = api;

export default api;
