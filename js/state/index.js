// FILE: js/state/index.js
// PURPOSE: Compatibility re-exports for state-level imports used across the app
// This file re-exports the canonical eventBus, EVENTS, logger, and ErrorHandler
// so modules importing from various paths can find expected named exports.

import eventBusDefault, { EVENTS, on, off, once, emit } from './event-bus.js';
import loggerDefault from '../services/logger.js';
import ErrorHandlerDefault from '../services/error-handler.js';

export const eventBus = eventBusDefault;
export { EVENTS };
export const onEvent = on;
export const offEvent = off;
export const onceEvent = once;
export const emitEvent = emit;

export const logger = loggerDefault;
export const ErrorHandler = ErrorHandlerDefault;

// Default export for backward compatibility
export default {
  eventBus: eventBusDefault,
  EVENTS,
  on: on,
  off: off,
  once: once,
  emit: emit,
  logger: loggerDefault,
  ErrorHandler: ErrorHandlerDefault
};
