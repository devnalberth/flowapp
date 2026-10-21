import { cloneElement, forwardRef, isValidElement, useId } from 'react'
import { AlertCircle } from 'lucide-react'
import './Field.css'

export default function Field({
  id,
  label,
  optional = false,
  hint,
  error,
  count,
  maxLength,
  className = '',
  children,
}) {
  const generatedId = useId()
  const controlId = id || children?.props?.id || generatedId
  const descriptionId = `${controlId}-description`
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: controlId,
        className: `fa-field__control ${children.props.className || ''}`,
        'aria-invalid': error ? true : undefined,
        'aria-describedby':
          [children.props['aria-describedby'], (error || hint) && descriptionId]
            .filter(Boolean)
            .join(' ') || undefined,
      })
    : children
  return (
    <div className={`fa-field ${error ? 'fa-field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={controlId}>
          {label}
          {optional && <span> · opcional</span>}
        </label>
      )}
      {control}
      {(error || hint || maxLength != null) && (
        <div className="fa-field__footer">
          {(error || hint) && (
            <p id={descriptionId} role={error ? 'alert' : undefined}>
              {error && <AlertCircle size={13} strokeWidth={1.75} aria-hidden="true" />}
              {error || hint}
            </p>
          )}
          {maxLength != null && (
            <span>
              {count ?? 0}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function control(Component, defaultType) {
  return forwardRef(function Control(
    { label, optional, hint, error, className, count, ...props },
    ref
  ) {
    return (
      <Field
        label={label}
        optional={optional}
        hint={hint}
        error={error}
        className={className}
        maxLength={props.maxLength}
        count={count ?? String(props.value ?? props.defaultValue ?? '').length}
      >
        <Component ref={ref} {...(defaultType ? { type: defaultType } : {})} {...props} />
      </Field>
    )
  })
}
export const Input = control('input', 'text')
export const Select = control('select')
export const DateInput = control('input', 'date')
export const Textarea = control('textarea')
