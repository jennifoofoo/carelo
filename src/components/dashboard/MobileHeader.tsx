import { useState } from "react";
import { Menu, Mic, Upload, Plus, ChevronLeft, X, Search, User, Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileHeaderProps {
  caseName?: string;
  caseId?: string;
  onMenuOpen: () => void;
  onVoiceCapture: () => void;
  onUpload: () => void;
  onNewNote: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const MobileHeader = ({
  caseName = "No case selected",
  caseId,
  onMenuOpen,
  onVoiceCapture,
  onUpload,
  onNewNote,
  onBack,
  showBackButton = false,
}: MobileHeaderProps) => {
  const truncatedName = caseName.length > 20 ? `${caseName.substring(0, 20)}...` : caseName;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left - Menu or Back */}
        <button
          onClick={showBackButton ? onBack : onMenuOpen}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-foreground active:bg-muted transition-colors"
          aria-label={showBackButton ? "Go back" : "Open menu"}
        >
          {showBackButton ? (
            <ChevronLeft className="w-6 h-6" strokeWidth={2} />
          ) : (
            <Menu className="w-6 h-6" strokeWidth={2} />
          )}
        </button>

        {/* Center - Case name */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
          <h1 className="text-base font-semibold text-foreground truncate max-w-full">
            {truncatedName}
          </h1>
          {caseId && (
            <p className="text-[11px] text-muted-foreground">
              Case #{caseId.substring(0, 8)}
            </p>
          )}
        </div>

        {/* Right - Quick actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onVoiceCapture}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-primary active:bg-primary/10 transition-colors"
            aria-label="Voice note"
          >
            <Mic className="w-5 h-5" strokeWidth={2} />
          </button>
          <button
            onClick={onUpload}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground active:bg-muted transition-colors"
            aria-label="Upload file"
          >
            <Upload className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
};

// Full-screen hamburger menu
interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const MobileMenu = ({ isOpen, onClose, onNavigate }: MobileMenuProps) => {
  const menuItems = [
    { icon: User, label: "Profile", route: "profile" },
    { icon: Settings, label: "Settings", route: "settings" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-graphite/50 z-[60]"
            onClick={onClose}
          />
          
          {/* Menu panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-background z-[70] flex flex-col safe-area-top safe-area-bottom"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-heading text-xl font-bold text-primary">Carelo</span>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground active:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4">
              <div className="flex items-center gap-3 px-4 h-12 bg-muted rounded-xl">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search cases..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
            </div>

            {/* Menu items */}
            <nav className="flex-1 px-2">
              {menuItems.map((item) => (
                <button
                  key={item.route}
                  onClick={() => {
                    onNavigate(item.route);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-foreground active:bg-muted transition-colors"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-base font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
              <button className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-destructive active:bg-destructive/10 transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="text-base font-medium">Log out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
