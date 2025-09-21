'use client';
import axios from 'axios';


import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import {
  Bell,
  Send,
  Users,
  BarChart3,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  MessageSquare,
  ShoppingCart,
  Truck,
  Settings,
  AlertCircle,
  Clock,
  EyeOff,

  RefreshCw,

} from 'lucide-react';
import {
  getNotificationStats,
  getFCMTokenStats,
  sendNotificationToUser,
  sendNotificationToRole,
  sendNotificationToCustomers,
  sendNotificationToAllUsers,
  type NotificationStats,
  type FCMTokenStats,
  type SendNotificationPayload
} from '@/services/admin-api';

interface NotificationFormData {
  title: string;
  body: string;
  type: 'order' | 'message' | 'promotion' | 'delivery' | 'system' | 'review' | 'inventory' | 'reminder';
  targetType: 'user' | 'role' | 'customers' | 'all';
  userId?: number;
  roleId?: number;
  data?: Record<string, string | number | boolean>;

}

export default function NotificationsPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [fcmStats, setFcmStats] = useState<FCMTokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'stats'>('overview');
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    body: '',
    type: 'message',
    targetType: 'all'
  });

  useEffect(() => {
    loadStats();
  }, []);
  type TabId = 'overview' | 'send' | 'stats';

  const loadStats = async () => {
    try {
      setLoading(true);
      const [notificationStats, tokenStats] = await Promise.all([
        getNotificationStats(),
        getFCMTokenStats()
      ]);
      setStats(notificationStats);
      setFcmStats(tokenStats);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!formData.title || !formData.body) {
      alert(t('notifications.fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    try {
      setSending(true);
      const payload: SendNotificationPayload = {
        title: formData.title,
        body: formData.body,
        data: {
          type: formData.type,
          ...formData.data
        }
      };

      let result;
      switch (formData.targetType) {
        case 'user':
          if (!formData.userId) {
            alert(t('notifications.selectUser') || 'Please select a user');
            return;
          }
          console.log(payload);
          result = await sendNotificationToUser({ ...payload, userId: formData.userId });
          break;
        case 'role':
          if (!formData.roleId) {
            alert(t('notifications.selectRole') || 'Please select a role');
            return;
          }
          result = await sendNotificationToRole({ ...payload, roleId: formData.roleId });
          break;

        case 'customers':
          result = await sendNotificationToCustomers(payload);
          break;
        case 'all':
          result = await sendNotificationToAllUsers(payload);
          break;
        default:
          throw new Error('Invalid target type');
      }

      if (result.success) {
        alert(t('notifications.sentSuccessfully') || 'Notification sent successfully!');
        setFormData({
          title: '',
          body: '',
          type: 'message',
          targetType: 'all'
        });
        loadStats(); // Refresh stats
      } else {
        alert(t('notifications.sendFailed') || 'Failed to send notification');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          alert(t('notifications.userNotInstalled') || 'This user has not installed the app yet.');
          return;
        }
      } else {
        console.error('Error sending notification:', error);
        alert(t('notifications.sendError') || 'Error sending notification');
      }

    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'promotion': return <TrendingUp className="w-4 h-4" />;
      case 'delivery': return <Truck className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      case 'review': return <MessageSquare className="w-4 h-4" />;
      case 'inventory': return <AlertCircle className="w-4 h-4" />;
      case 'reminder': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'web': return <Monitor className="w-4 h-4" />;
      case 'android': return <Smartphone className="w-4 h-4" />;
      case 'ios': return <Tablet className="w-4 h-4" />;
      default: return <Smartphone className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-theme-main"></div>
      </div>
    );
  }
  type TargetType =
    | 'all'
    | 'customers'

    | 'role'
    | 'user';
  type FormDataType =
    | 'message'
    | 'order'
    | 'promotion'
    | 'delivery'
    | 'system'
    | 'review'
    | 'inventory'
    | 'reminder';
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-8 h-8 text-theme-main" />
                {t('admin.notifications')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('notifications.description') || 'Manage and send push notifications to your users'}
              </p>
            </div>
            <button
              onClick={loadStats}
              className="flex items-center gap-2 px-4 py-2 bg-theme-main text-white rounded-lg hover:bg-theme-dark transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.refresh') || 'Refresh'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: t('notifications.overview') || 'Overview', icon: BarChart3 },
                { id: 'send', label: t('notifications.sendNotification') || 'Send Notification', icon: Send },
                { id: 'stats', label: t('notifications.statistics') || 'Statistics', icon: TrendingUp }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-theme-main text-theme-main'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Notifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t('notifications.totalNotifications') || 'Total Notifications'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalNotifications || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Unread Notifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <EyeOff className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t('notifications.unreadNotifications') || 'Unread Notifications'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.unreadNotifications || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t('notifications.recentNotifications') || 'Recent (7 days)'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.recentNotifications || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Tokens */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Smartphone className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t('notifications.activeTokens') || 'Active Tokens'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.activeTokens || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'send' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('notifications.sendNewNotification') || 'Send New Notification'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notification Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('notifications.title') || 'Title'} *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-main focus:border-transparent"
                    placeholder={t('notifications.titlePlaceholder') || 'Enter notification title'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('notifications.message') || 'Message'} *
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-main focus:border-transparent"
                    placeholder={t('notifications.messagePlaceholder') || 'Enter notification message'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('notifications.type') || 'Type'}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as FormDataType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-main focus:border-transparent"
                  >
                    <option value="message">{t('notifications.typeMessage') || 'Message'}</option>
                    <option value="order">{t('notifications.typeOrder') || 'Order'}</option>
                    <option value="promotion">{t('notifications.typePromotion') || 'Promotion'}</option>
                    <option value="delivery">{t('notifications.typeDelivery') || 'Delivery'}</option>
                    <option value="system">{t('notifications.typeSystem') || 'System'}</option>
                    <option value="review">{t('notifications.typeReview') || 'Review'}</option>
                    <option value="inventory">{t('notifications.typeInventory') || 'Inventory'}</option>
                    <option value="reminder">{t('notifications.typeReminder') || 'Reminder'}</option>
                  </select>
                </div>
              </div>

              {/* Target Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('notifications.target') || 'Target'}
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value as TargetType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-main focus:border-transparent"
                  >
                    <option value="all">{t('notifications.targetAllUsers') || 'All Users'}</option>
                    <option value="customers">{t('notifications.targetCustomers') || 'All Customers'}</option>
                    <option value="role">{t('notifications.targetRole') || 'Specific Role'}</option>
                    <option value="user">{t('notifications.targetUser') || 'Specific User'}</option>
                  </select>
                </div>

                {formData.targetType === 'role' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('notifications.selectRole') || 'Select Role'}
                    </label>
                    <select
                      value={formData.roleId || ''}
                      onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-main focus:border-transparent"
                    >
                      <option value="">{t('notifications.selectRole') || 'Select Role'}</option>
                      <option value="2">{t('notifications.roleCustomer') || 'Customer'}</option>
                      <option value="3">{t('notifications.roleVendorBasic') || 'Vendor (Basic)'}</option>
                      <option value="4">{t('notifications.roleVendorPremium') || 'Vendor (Premium)'}</option>
                      <option value="5">{t('notifications.roleVendorEnterprise') || 'Vendor (Enterprise)'}</option>
                    </select>
                  </div>
                )}

                {formData.targetType === 'user' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('notifications.userId') || 'User ID'}
                    </label>
                    <input
                      type="number"
                      value={formData.userId || ''}
                      onChange={(e) => setFormData({ ...formData, userId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-main focus:border-transparent"
                      placeholder={t('notifications.userIdPlaceholder') || 'Enter user ID'}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSendNotification}
                disabled={sending || !formData.title || !formData.body}
                className="flex items-center gap-2 px-6 py-3 bg-theme-main text-white rounded-lg hover:bg-theme-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? (t('notifications.sending') || 'Sending...') : (t('notifications.send') || 'Send Notification')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Notifications by Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('notifications.notificationsByType') || 'Notifications by Type'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats?.notificationsByType.map((item) => (
                  <div key={item.type} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-theme-main/10 rounded-lg">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {item.type}
                      </p>
                      <p className="text-2xl font-bold text-theme-main">
                        {item.count}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FCM Token Statistics */}
            {fcmStats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tokens by Device */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('notifications.tokensByDevice') || 'Tokens by Device'}
                  </h3>
                  <div className="space-y-3">
                    {fcmStats.tokensByDevice.map((item) => (
                      <div key={item.device_type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 bg-theme-main/10 rounded-lg">
                            {getDeviceIcon(item.device_type)}
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900 capitalize">
                            {item.device_type}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-theme-main">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tokens by Role */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('notifications.tokensByRole') || 'Tokens by Role'}
                  </h3>
                  <div className="space-y-3">
                    {fcmStats.tokensByRole.map((item) => (
                      <div key={item.role_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 bg-theme-main/10 rounded-lg">
                            <Users className="w-4 h-4" />
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {item.role_id === 2 && (t('notifications.roleCustomer') || 'Customer')}
                            {item.role_id === 3 && (t('notifications.roleVendorBasic') || 'Vendor (Basic)')}
                            {item.role_id === 4 && (t('notifications.roleVendorPremium') || 'Vendor (Premium)')}
                            {item.role_id === 5 && (t('notifications.roleVendorEnterprise') || 'Vendor (Enterprise)')}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-theme-main">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 