import { useFormContext } from "react-hook-form";
import { Input } from "../ui/input";
import { FieldWrapper } from "./FieldWrapper";

export const TextField = ({ name, label, helperText, ...props }: any) => {
  const { register, formState: { errors } } = useFormContext();
  return (
    <FieldWrapper label={label} error={errors[name]} helperText={helperText}>
      <Input {...register(name)} {...props} />
    </FieldWrapper>
  );
};
