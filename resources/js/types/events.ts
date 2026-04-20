/**
 * Form Event Type Definitions
 * Centralized React event types for consistent usage across the application
 */

import type { FormEventHandler, ChangeEvent } from 'react';

export type FormEventHandlerType = FormEventHandler;
export type ChangeEventType = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

/**
 * Form submission handler type
 * Usage: const handleSubmit: FormEventHandlerType = (e) => { ... }
 */
export interface FormHandlerOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
}
