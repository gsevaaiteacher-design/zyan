// FILE: js/state/logger.js
// PURPOSE: Compatibility re-export for logger used by modules importing from js/state

import loggerDefault from '../services/logger.js';

export const logger = loggerDefault;
export default loggerDefault;
