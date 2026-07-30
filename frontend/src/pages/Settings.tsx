import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  Building2,
  Plug,
  Bell,
  Key,
  Camera,
  Copy,
  Trash2,
  Plus,
  Check,
  X,
  RefreshCw,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types & Static Data
// ---------------------------------------------------------------------------

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

type SettingsTab = 'Profile' | 'Agency' | 'Integrations' | 'Notifications' | 'API Keys'

const settingsTabs: { label: SettingsTab; icon: React.ElementType }[] = [
  { label: 'Profile', icon: User },
  { label: 'Agency', icon: Building2 },
  { label: 'Integrations', icon: Plug },
  { label: 'Notifications', icon: Bell },
  { label: 'API Keys', icon: Key },
]

const integrations = [
  { name: 'Google Ads', connected: false, icon: '🔍' },
  { name: 'Facebook Ads', connected: false, icon: '📘' },
  { name: 'LinkedIn Ads', connected: false, icon: '💼' },
  { name: 'Google Analytics', connected: false, icon: '📊' },
  { name: 'Google Search Console', connected: false, icon: '🌐' },
]

const notificationSettings = [
  { id: 'seo_score', enabled: true },
  { id: 'keyword_ranking', enabled: true },
  { id: 'backlink_new', enabled: false },
  { id: 'backlink_lost', enabled: true },
  { id: 'crawl_errors', enabled: true },
  { id: 'campaign_complete', enabled: false },
  { id: 'weekly_digest', enabled: true },
  { id: 'ai_content', enabled: true },
]

const apiKeys = [
  { id: '1', name: 'Production API Key', key: 'mk_prod_a3f8c92d...e4b1', created: 'Jan 15, 2026', lastUsedCount: 2, lastUsedUnit: 'hoursAgo' as const },
  { id: '2', name: 'Development Key', key: 'mk_dev_7b2e41a0...9f3c', created: 'Feb 20, 2026', lastUsedCount: 5, lastUsedUnit: 'daysAgo' as const },
]

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

export default function Settings() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<SettingsTab>('Profile')
  const [notifications, setNotifications] = useState(notificationSettings)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Profile state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const apiFetch = (url: string, options?: RequestInit) => {
    return fetch(url, { ...options, headers: { ...getHeaders(), ...options?.headers } })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return null; }
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      });
  };

  // Fetch user profile on load
  useEffect(() => {
    setProfileLoading(true);
    apiFetch(`${API}/auth/me`)
      .then(d => {
        if (!d) return;
        const fullName = d.full_name || d.name || '';
        const parts = fullName.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
        setEmail(d.email || '');
      })
      .catch((e) => setErrorMsg(e.message))
      .finally(() => setProfileLoading(false));
  }, []);

  const handleSaveProfile = () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    const fullName = `${firstName} ${lastName}`.trim();
    const params = new URLSearchParams({ full_name: fullName, email });
    apiFetch(`${API}/auth/me?${params.toString()}`, { method: 'PUT' })
      .then((d) => {
        if (!d) return;
        setSuccessMsg(t('settings.profileSaved'));
        setTimeout(() => setSuccessMsg(''), 3000);
      })
      .catch((e) => setErrorMsg(e.message))
      .finally(() => setSaving(false));
  };

  function toggleNotification(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    )
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '??';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('nav.settings')}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {t('settings.subtitle')}
          </p>
        </div>

        {successMsg && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Tabs */}
          <nav className="w-full shrink-0 lg:w-56">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col">
              {settingsTabs.map(({ label, icon: Icon }) => (
                <li key={label}>
                  <button
                    onClick={() => setActiveTab(label)}
                    className={`flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                      activeTab === label
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t(`settings.tabs.${label}`)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div className="flex-1">
            {/* ---- Profile Tab ---- */}
            {activeTab === 'Profile' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
                    {t('settings.profileInformation')}
                  </h2>

                  {profileLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                    </div>
                  ) : (
                    <>
                      {/* Avatar */}
                      <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-2xl font-bold text-white">
                          {initials}
                        </div>
                        <div>
                          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                            <Camera className="h-4 w-4" />
                            {t('settings.changeAvatar')}
                          </button>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t('settings.avatarHint')}
                          </p>
                        </div>
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('settings.firstName')}
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('settings.lastName')}
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('login.email')}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? t('common.saving') : t('common.saveChanges')}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Change Password */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
                    {t('settings.changePassword')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('settings.currentPassword')}
                      </label>
                      <input
                        type="password"
                        placeholder={t('settings.currentPasswordPlaceholder')}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('settings.newPassword')}
                        </label>
                        <input
                          type="password"
                          placeholder={t('settings.newPasswordPlaceholder')}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('settings.confirmPassword')}
                        </label>
                        <input
                          type="password"
                          placeholder={t('settings.confirmPasswordPlaceholder')}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                      {t('settings.updatePassword')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Agency Tab ---- */}
            {activeTab === 'Agency' && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.agencySettings')}
                </h2>

                {/* Logo */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-bold text-white">
                    MO
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Camera className="h-4 w-4" />
                    {t('settings.changeLogo')}
                  </button>
                </div>

                {/* Agency Name */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settings.agencyName')}
                  </label>
                  <input
                    type="text"
                    defaultValue="MarketingOS Agency"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Subscription Plan */}
                <div className="mb-6">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settings.subscriptionPlan')}
                  </label>
                  <div className="flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="flex-1">
                      <p className="font-semibold text-blue-700 dark:text-blue-400">{t('settings.professionalPlan')}</p>
                      <p className="text-sm text-blue-600/80 dark:text-blue-400/70">
                        {t('settings.planDesc')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">$199</p>
                      <p className="text-xs text-blue-600/80 dark:text-blue-400/70">{t('settings.perMonth')}</p>
                    </div>
                  </div>
                  <button className="mt-3 text-sm font-medium text-blue-600 transition hover:text-blue-500 dark:text-blue-400">
                    {t('settings.upgradePlan')}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                    {t('common.saveChanges')}
                  </button>
                </div>
              </div>
            )}

            {/* ---- Integrations Tab ---- */}
            {activeTab === 'Integrations' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.connectedServices')}
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {integrations.map((integration) => (
                    <div
                      key={integration.name}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {integration.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t(`settings.integrationDescriptions.${integration.name}`)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            integration.connected
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {integration.connected ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          {integration.connected ? t('clientDetail.connected') : t('settings.notConnected')}
                        </span>
                        <button
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            integration.connected
                              ? 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:bg-gray-800 dark:text-rose-400 dark:hover:bg-rose-900/20'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {integration.connected ? t('settings.disconnect') : t('socialMedia.connect')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- Notifications Tab ---- */}
            {activeTab === 'Notifications' && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.notificationPreferences')}
                </h2>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notifications.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{t(`settings.notifications.${setting.id}.label`)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t(`settings.notifications.${setting.id}.description`)}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleNotification(setting.id)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          setting.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            setting.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                    {t('settings.savePreferences')}
                  </button>
                </div>
              </div>
            )}

            {/* ---- API Keys Tab ---- */}
            {activeTab === 'API Keys' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.apiKeysTitle')}</h2>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    {t('settings.generateNewKey')}
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="flex items-center justify-between p-5">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{t(`settings.apiKeyNames.${apiKey.name}`)}</p>
                          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-gray-700">
                              {apiKey.key}
                            </code>
                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {t('settings.createdLabel', { date: apiKey.created, lastUsed: t(`settings.${apiKey.lastUsedUnit}`, { count: apiKey.lastUsedCount }) })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button className="rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Usage Notice */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>{t('settings.apiKeyNoticeImportant')}</strong> {t('settings.apiKeyNoticeText')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
