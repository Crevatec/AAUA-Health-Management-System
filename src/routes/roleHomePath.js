export function roleHomePath(role) {
  switch (role) {
    case "administrator":
      return "/admin";
    case "medical_staff":
      return "/staff";
    case "student":
      return "/student";
    case "lecturer":
      return "/lecturer";
    default:
      return "/login";
  }
}
