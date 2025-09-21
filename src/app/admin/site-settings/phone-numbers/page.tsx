'use client';
import { useI18n } from '@/contexts/I18nContext';
import { useEffect, useState } from 'react';
import { getSiteSettings, updateSiteSetting } from '@/services/admin-api';

const SETTING_LABELS: Record<string, { label: string; type?: string }> = {
  phone: { label: 'admin.phoneNumbers' },
  whatsapp: { label: 'WhatsApp' },
  tech_support: { label: 'Technical Support' },
  email: { label: 'admin.email' },
  facebook: { label: 'Facebook' },
  x: { label: 'X (Twitter)' },
  instagram: { label: 'Instagram' },
};

export default function PhoneNumbersPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSiteSettings()
      .then(data => setSettings(data))
      .catch(() => setError('Failed to fetch site settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = (key: string) => {
    setEditKey(key);
    setEditValue(settings[key] || '');
  };

  const handleSave = async () => {
    if (!editKey) return;
    setSaving(true);
    setError('');
    try {
      await updateSiteSetting(editKey, editValue);
      setSettings(prev => ({ ...prev, [editKey]: editValue }));
      setEditKey(null);
    } catch {
      setError('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-0 w-full max-w-full">
      <h1 className="text-2xl font-bold mb-4 w-full">{t('admin.phoneNumbers')}</h1>
      {loading ? (
        <div className="text-gray-500 animate-pulse w-full">{t('admin.loading')}</div>
      ) : error ? (
        <div className="text-red-500 w-full">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100 w-full">
          {Object.entries(SETTING_LABELS).map(([key, { label }]) => (
            <div key={key} className="flex items-center px-4 py-3 hover:bg-gray-50 transition w-full">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{t(label) || label}</div>
                <div className="text-gray-500 text-sm break-all">
                  {editKey === key ? (
                    <input
                      className="border rounded px-2 py-1 w-full mt-1"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      disabled={saving}
                      autoFocus
                    />
                  ) : (
                    settings[key] || <span className="italic text-gray-400">{t('admin.noDataAvailable') || 'No data'}</span>
                  )}
                </div>
              </div>
              <div className="ml-4 flex items-center gap-2">
                {editKey === key ? (
                  <>
                    <button
                      className="bg-theme-main text-white px-3 py-1 rounded hover:bg-theme-main/90 transition disabled:opacity-50"
                      onClick={handleSave}
                      disabled={saving || editValue === settings[key]}
                    >
                      {saving ? t('admin.saving') : t('admin.save')}
                    </button>
                    <button
                      className="text-gray-500 hover:text-gray-800 px-2 py-1"
                      onClick={() => setEditKey(null)}
                      disabled={saving}
                    >
                      {t('admin.cancel')}
                    </button>
                  </>
                ) : (
                  <button
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition"
                    onClick={() => handleEdit(key)}
                  >
                    {t('admin.edit')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 