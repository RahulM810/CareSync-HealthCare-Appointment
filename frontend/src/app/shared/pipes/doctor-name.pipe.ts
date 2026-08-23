import { Pipe, PipeTransform } from '@angular/core';

/**
 * Standardizes doctor names by stripping any redundant "Dr.", "Dr", "dr.", "Doctor" prefixes
 * and returning a consistent "Dr. <Name>" format.
 */
export function formatDoctorName(name: string | null | undefined): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  // Remove repeated leading prefixes like "Dr.", "Dr", "dr.", "Doctor", "Dr. Dr."
  const cleaned = trimmed.replace(/^((dr\.?|doctor)\s*)+/gi, '').trim();
  return cleaned ? `Dr. ${cleaned}` : trimmed;
}

@Pipe({
  name: 'doctorName',
  standalone: true
})
export class DoctorNamePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatDoctorName(value);
  }
}
