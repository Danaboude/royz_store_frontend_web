import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useUser } from '@/contexts/UserContext';
import ChangePasswordDialog from './ChangePasswordDialog';
import ProfileImageUpload from './ProfileImageUpload';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  userId?: number;
}

interface SettingsOption {
  key: string;
  route?: string;
  action?: string;
}

const settingsOptions: SettingsOption[] = [
  { key: 'settingsDialog.aboutUs', route: '/about' },
  { key: 'settingsDialog.privacyPolicy', route: '/privacy-policy' },
  { key: 'settingsDialog.returnPolicy', route: '/return-policy' },
  { key: 'settingsDialog.faq', route: '/faq' },
  { key: 'settingsDialog.profileImage', action: 'profileImage' },
  { key: 'settingsDialog.changePassword', action: 'changePassword' },
  { key: 'settingsDialog.logout', action: 'logout' },
];

export default function SettingsDialog({ open, onClose, userId }: SettingsDialogProps) {
  const { locale, t } = useI18n();
  const { setIsLoggedIn, setUser, isLoggedIn } = useUser();
  const isRTL = locale === 'ar';
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProfileImage, setShowProfileImage] = useState(false);

  if (!open) return null;

  const handleLogout = () => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    // Update user context
    setIsLoggedIn(false);
    setUser(null);
    // Close the dialog
    onClose();
  };

  const handleOptionClick = (option: SettingsOption) => {
    if (option.route) {
      window.location.assign(option.route);
    } else if (option.action === 'changePassword') {
      setShowChangePassword(true);
    } else if (option.action === 'profileImage') {
      setShowProfileImage(true);
    } else if (option.action === 'logout') {
      handleLogout();
    }
  };

  // Filter options based on login status
  const filteredOptions = settingsOptions.filter(option => {
    if (option.action === 'changePassword' || option.action === 'logout' || option.action === 'profileImage') {
      return isLoggedIn;
    }
    return true;
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="relative bg-[#F7F7FA] rounded-2xl shadow-2xl flex flex-col w-full max-w-xl mx-4 p-8" dir={isRTL ? 'rtl' : 'ltr'}>
          <button
            className="absolute top-4 left-4 bg-[#F8C291]/30 hover:bg-[#F8C291]/60 rounded-full p-1.5 z-10"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-6 h-6 text-[#2C2C54]" />
          </button>
          <div className="mb-6 text-2xl font-bold text-[#2C2C54] text-center" style={{fontFamily: 'Tajawal, sans-serif'}}>
            {t('settingsDialog.title') as string}
          </div>
          <ul className="divide-y divide-gray-300">
            {filteredOptions.map((option, idx) => (
              <li
                key={idx}
                className="py-4 px-2 text-lg text-[#2C2C54] text-center cursor-pointer hover:bg-gray-100 rounded transition"
                onClick={() => handleOptionClick(option)}
              >
                {t(option.key) as string}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Change Password Dialog */}
      {showChangePassword && userId && (
        <ChangePasswordDialog
          open={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          userId={userId}
        />
      )}

      {/* Profile Image Upload Dialog */}
      {showProfileImage && userId && (
        <ProfileImageUpload
          open={showProfileImage}
          onClose={() => setShowProfileImage(false)}
          userId={userId}
        />
      )}
    </>
  );
} 