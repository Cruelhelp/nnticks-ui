import { useFormContext } from "react-hook-form";

export function useFormField() {
  const context = useFormContext();
  if (!context) {
    throw new Error("useFormField must be used within a FormProvider");
  }
  // ...rest of the implementation as in form.tsx
}
