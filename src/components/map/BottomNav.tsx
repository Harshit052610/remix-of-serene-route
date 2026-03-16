import React from 'react';
import { Compass, Navigation2, PenTool, Bell } from 'lucide-react';

type NavItem = 'explore' | 'commute' | 'contribute' | 'updates';

interface BottomNavProps {
  activeItem: NavItem;
  onItemClick: (item: NavItem) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeItem, onItemClick }) => {
  const items: { id: NavItem; icon: React.ReactNode; label: string }[] = [
    { id: 'explore', icon: <Compass className="w-5 h-5" />, label: 'Explore' },
    { id: 'commute', icon: <Navigation2 className="w-5 h-5" />, label: 'Commute' },
    { id: 'contribute', icon: <PenTool className="w-5 h-5" />, label: 'Contribute' },
    { id: 'updates', icon: <Bell className="w-5 h-5" />, label: 'Updates' },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
      <div className="glass-panel rounded-2xl px-2 py-1 flex items-center gap-1 shadow-elevated">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
          >
            <div
              className={`p-2 rounded-full transition-colors ${
                activeItem === item.id ? 'bg-primary/10' : ''
              }`}
            >
              {item.icon}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
