import React, { useState } from 'react';
import { AlertTriangle, Phone, MessageCircle, Share2, X, Shield } from 'lucide-react';
import { LatLng } from '@/types/map';

interface SOSButtonProps {
  currentPosition: LatLng | null;
  onTriggerSOS: () => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ currentPosition, onTriggerSOS }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const emergencyContacts = [
    { name: 'Police', number: '100', icon: '👮' },
    { name: 'Women Helpline', number: '181', icon: '📞' },
    { name: 'Ambulance', number: '108', icon: '🚑' },
    { name: 'Emergency', number: '112', icon: '🆘' },
  ];

  const handleSOS = async () => {
    setIsSending(true);
    
    // Simulate sending SOS
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onTriggerSOS();
    setSent(true);
    setIsSending(false);

    // Reset after 3 seconds
    setTimeout(() => {
      setSent(false);
      setShowPanel(false);
    }, 3000);
  };

  const shareLocation = () => {
    if (!currentPosition) return;

    const url = `https://www.google.com/maps?q=${currentPosition.lat},${currentPosition.lng}`;
    
    if (navigator.share) {
      navigator.share({
        title: '🆘 Emergency Location',
        text: 'I need help! This is my current location:',
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Location copied to clipboard!');
    }
  };

  return (
    <>
      {/* SOS Button */}
      <button
        onClick={() => setShowPanel(true)}
        className="fab fab-sos absolute left-4 bottom-32 z-20"
        title="Emergency SOS"
      >
        <AlertTriangle className="w-6 h-6" />
      </button>

      {/* SOS Panel */}
      {showPanel && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="glass-panel rounded-3xl p-6 max-w-sm mx-4 animate-bounce-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-destructive" />
                <h3 className="font-serif text-xl font-semibold">Emergency SOS</h3>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sent ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-success flex items-center justify-center animate-bounce-in">
                  <Shield className="w-10 h-10 text-success-foreground" />
                </div>
                <h4 className="font-serif text-lg font-semibold text-success mb-2">
                  SOS Sent Successfully!
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your emergency contacts have been notified with your location.
                </p>
              </div>
            ) : (
              <>
                {/* Quick SOS */}
                <button
                  onClick={handleSOS}
                  disabled={isSending}
                  className={`w-full py-4 mb-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    isSending
                      ? 'bg-destructive/50 cursor-not-allowed'
                      : 'bg-destructive text-destructive-foreground hover:opacity-90 active:scale-95'
                  }`}
                >
                  {isSending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                      Sending SOS...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5" />
                      Send SOS Alert
                    </>
                  )}
                </button>

                {/* Emergency Numbers */}
                <div className="mb-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Quick Call
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {emergencyContacts.map((contact) => (
                      <a
                        key={contact.number}
                        href={`tel:${contact.number}`}
                        className="flex items-center gap-2 p-3 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                      >
                        <span className="text-xl">{contact.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{contact.name}</div>
                          <div className="text-xs text-muted-foreground">{contact.number}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Share Location */}
                <button
                  onClick={shareLocation}
                  className="w-full py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share My Location
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
