
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MemberEmailEditProps {
  isOpen: boolean;
  memberName: string;
  currentEmail: string;
  onClose: () => void;
  onSubmit: (newEmail: string) => Promise<void>;
}

export const MemberEmailEdit = ({
  isOpen,
  memberName,
  currentEmail,
  onClose,
  onSubmit,
}: MemberEmailEditProps) => {
  const [newEmail, setNewEmail] = React.useState(currentEmail);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    // Update the newEmail state when currentEmail changes
    setNewEmail(currentEmail);
  }, [currentEmail]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(newEmail);
      onClose();
    } catch (error) {
      console.error('Error updating email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zmień adres email - {memberName}</AlertDialogTitle>
          <AlertDialogDescription>
            Wprowadź nowy adres email dla użytkownika. Ta operacja zmieni adres email w systemie.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground mb-2">
              Obecny adres email: <span id="current-member-email" data-email={currentEmail} className="font-medium">{currentEmail || 'Brak'}</span>
            </div>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Nowy adres email"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isSubmitting || !newEmail || newEmail === currentEmail}
          >
            {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
