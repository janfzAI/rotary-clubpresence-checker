
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const ReadOnlyNotice = () => {
  return (
    <Alert variant="destructive" className="mb-4 bg-yellow-50">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Masz dostęp tylko do odczytu. Nie możesz dokonywać zmian ani usuwać danych.
      </AlertDescription>
    </Alert>
  );
};
