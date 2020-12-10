import { FieldError } from "src/resolvers/types/errors";

export function generateStandardError(
  err: any = undefined,
  field = "Unknown",
  message = "Something went wrong, please try again later"
) {
  if (err !== undefined && err.name === "ValidationError") {
    let errors = [] as FieldError[];

    Object.keys(err.errors).forEach((key) => {
      errors.push({ field: key, message: err.errors[key].message });
    });

    return { errors };
  }

  return {
    errors: [
      {
        field,
        message,
      },
    ],
  };
}
