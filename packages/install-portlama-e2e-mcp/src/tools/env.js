// ============================================================================
// env_detect — Hardware detection and profile recommendation
// ============================================================================

import { z } from 'zod';
import { detectHardware, recommendProfile } from '../lib/profiles.js';
import { PROFILES } from '../config.js';

export const envDetectTool = {
  name: 'env_detect',
  description:
    'Detect host hardware capabilities and recommend a VM profile. ' +
    'Returns CPU count, available memory, recommended profile, and all supported profiles. ' +
    'Run this before vm_create to choose the right resource tier.',
  inputSchema: z.object({}),
  async handler() {
    const hardware = detectHardware();
    const recommendation = recommendProfile(hardware);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              host: {
                cpus: hardware.cpus,
                totalMemoryGB: hardware.totalMemoryGB,
                freeMemoryGB: hardware.freeMemoryGB,
              },
              recommendedProfile: recommendation.name,
              supportedProfiles: recommendation.supported,
              profileSpecs: Object.fromEntries(
                recommendation.supported.map((name) => [name, PROFILES[name]]),
              ),
              note: recommendation.note,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
