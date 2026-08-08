export function ErrorMessage({ title = "Error", children }) {
  if (!children) return null;

  return (
    <div className="alert alert--error" role="alert">
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}
