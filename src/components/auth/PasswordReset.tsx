
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const PasswordReset = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setPasswordError('Hasła muszą być identyczne');
      return;
    }
    
    if (password.length < 6) {
      setPasswordError('Hasło musi mieć co najmniej 6 znaków');
      return;
    }
    
    setPasswordError('');
    setIsSubmitting(true);
    
    try {
      console.log('Attempting to update user password');
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        console.error('Error resetting password:', error);
        setPasswordError(error.message || 'Nie udało się zresetować hasła');
        toast({
          title: "Błąd zmiany hasła",
          description: error.message || 'Nie udało się zresetować hasła',
          variant: "destructive"
        });
      } else {
        console.log('Password reset successful');
        toast({
          title: "Hasło zmienione",
          description: "Twoje hasło zostało pomyślnie zmienione. Zaloguj się ponownie."
        });
        
        // Sign out the user and redirect to auth page
        await supabase.auth.signOut();
        navigate('/auth');
      }
    } catch (error: any) {
      console.error('Unexpected error during password reset:', error);
      setPasswordError(error.message || 'Wystąpił nieoczekiwany błąd');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-6">Ustaw nowe hasło</h1>
      
      {passwordError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{passwordError}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nowe hasło</Label>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wprowadź nowe hasło"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Potwierdź nowe hasło</Label>
          <Input 
            id="confirm-password" 
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Potwierdź nowe hasło"
            required
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz nowe hasło'}
        </Button>
      </form>
    </div>
  );
};
