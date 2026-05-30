/**
 * AuthRequiredDialog — prompts unauthenticated users to log in.
 * Replaces the old Manus-specific login dialog.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingBag } from "lucide-react";

interface ManusDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  onLogin: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function ManusDialog({
  title,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: ManusDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    if (!onOpenChange) setInternalOpen(open);
  }, [open, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) onOpenChange(nextOpen);
    else setInternalOpen(nextOpen);
    if (!nextOpen) onClose?.();
  };

  return (
    <Dialog open={onOpenChange ? open : internalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[380px] rounded-2xl text-center p-0 gap-0 overflow-hidden">
        <div className="flex flex-col items-center gap-3 px-6 pt-10 pb-6">
          <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          {title && (
            <DialogTitle className="text-xl font-semibold text-slate-900">{title}</DialogTitle>
          )}
          <DialogDescription className="text-sm text-slate-500">
            Please sign in to your Gimbiya Mall account to continue.
          </DialogDescription>
        </div>
        <DialogFooter className="px-6 pb-6">
          <Button
            onClick={onLogin}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium"
          >
            Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
