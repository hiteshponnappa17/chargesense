import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export function Textarea({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  rows = 3,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={areaId} className="label-base">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        className={cn(
          'input-base resize-y',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500/40',
          className,
        )}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
