
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface MemberEmailEditProps {
  isOpen: boolean;
  memberName: string;
  currentEmail: string;
  onClose: () => void;
  onSubmit: (newEmail: string) => Promise<void>;
}

// Email validation schema
const emailSchema = z.object({
  email: z.string().email({ message: "Proszę podać prawidłowy adres email" }),
});

export const MemberEmailEdit = ({
  isOpen,
  memberName,
  currentEmail,
  onClose,
  onSubmit,
}: MemberEmailEditProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Set up form with validation
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: currentEmail,
    },
  });
  
  // Update form values when currentEmail changes
  React.useEffect(() => {
    form.reset({ email: currentEmail });
  }, [currentEmail, form]);

  const handleSubmit = async (values: z.infer<typeof emailSchema>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values.email);
      onClose();
    } catch (error) {
      console.error('Error updating email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if email is valid
  const emailValue = form.watch('email');
  const isEmailValid = form.formState.isValid;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zmień adres email - {memberName}</AlertDialogTitle>
          <AlertDialogDescription>
            Wprowadź nowy adres email dla użytkownika. Ta operacja zmieni adres email w systemie.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-2">
                  Obecny adres email: <span id="current-member-email" data-email={currentEmail} className="font-medium">{currentEmail || 'Brak'}</span>
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="email"
                          {...field}
                          placeholder="Nowy adres email"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel type="button">Anuluj</AlertDialogCancel>
              <Button 
                type="submit"
                disabled={isSubmitting || !isEmailValid}
                className={`
                  ${isEmailValid 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}
              >
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
