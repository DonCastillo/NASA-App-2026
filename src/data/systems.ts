import type { SystemDef } from '../types'
import { bones } from './systems/bones'
import { eyes } from './systems/eyes'
import { heart } from './systems/heart'

// All body systems, in the order of SYSTEM_IDS. Content only — no logic here.
// Each system lives in its own file in ./systems/. Filled one system at a time (plan/tasks.md 1.2).
export const SYSTEMS: SystemDef[] = [heart, eyes, bones]
