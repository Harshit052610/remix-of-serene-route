import React from 'react';
import { X, Settings, Moon, Sun, HelpCircle, Shield, Bell, LogOut, ChevronRight } from 'lucide-react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    { icon: Shield, label: 'Safety Settings', action: () => {} },
    { icon: Bell, label: 'Notifications', action: () => {} },
    { icon: Settings, label: 'App Settings', action: () => {} },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="fixed left-0 top-0 bottom-0 w-80 glass-panel z-50 animate-slide-up" style={{ animation: 'slide-in-left 0.3s ease-out' }}>
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-serif font-semibold text-lg">SafeWalk</h2>
                <p className="text-xs text-muted-foreground">Women's Safety App</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-secondary rounded-xl p-3">
            <div className="text-sm font-medium">Welcome, User</div>
            <div className="text-xs text-muted-foreground">Stay safe out there! 💪</div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4">
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full p-3 flex items-center gap-3 rounded-xl hover:bg-secondary transition-colors text-left"
              >
                <item.icon className="w-5 h-5 text-primary" />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="text-xs text-center text-muted-foreground">
            SafeWalk v1.0 • Made with ❤️ for women's safety
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};
