export function FormField({
  id,
  label,
  error,
  hint,
  required = false,
  children,
}) {
  return (
    <div className={`form-field${error ? " form-field--error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required ? <span className="required-mark"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="form-hint">{hint}</p> : null}
      {error ? (
        <p className="form-error" role="alert" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  id,
  label,
  error,
  hint,
  required = false,
  type = "text",
  ...props
}) {
  return (
    <FormField id={id} label={label} error={error} hint={hint} required={required}>
      <input
        id={id}
        type={type}
        className="input"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
        {...props}
      />
    </FormField>
  );
}

export function TextArea({
  id,
  label,
  error,
  hint,
  required = false,
  rows = 4,
  ...props
}) {
  return (
    <FormField id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        id={id}
        className="textarea"
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
        {...props}
      />
    </FormField>
  );
}

export function Select({
  id,
  label,
  error,
  hint,
  required = false,
  children,
  ...props
}) {
  return (
    <FormField id={id} label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        className="select"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
        {...props}
      >
        {children}
      </select>
    </FormField>
  );
}
