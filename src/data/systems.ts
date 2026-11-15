import type { SystemDef } from '../types'
import { balance } from './systems/balance'
import { bones } from './systems/bones'
import { eyes } from './systems/eyes'
import { heart } from './systems/heart'
import { immune } from './systems/immune'
import { metabolism } from './systems/metabolism'
import { mind } from './systems/mind'
import { radiation } from './systems/radiation'

// All 8 body systems, in the order of SYSTEM_IDS. Content only — no logic here.
// Each system lives in its own file in ./systems/ (plan/body-systems.md, plan/health-indicators.md).
export const SYSTEMS: SystemDef[] = [
  heart,
  eyes,
  bones,
  immune,
  metabolism,
  mind,
  balance,
  radiation,
]
