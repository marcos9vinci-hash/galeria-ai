import { useFormContext } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { FieldWrapper } from "./FieldWrapper";

export const TextArea = ({ name, label, helperText, ...props }: any) => {
  const { register, formState: { errors } } = useFormContext();
  return (
    <FieldWrapper label={label} error={errors[name]} helperText={helperText}>
      <Textarea {...register(name)} {...props} />
    </FieldWrapper>
  );
};
