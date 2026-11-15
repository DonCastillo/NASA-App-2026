import { MISSION_LIST } from '../data/missions'
import { selectMission } from '../state/selectors'
import { useAppStore } from '../state/useAppStore'
import Menu, { MenuItem } from './Menu'

// Mission ▾: ISS / Artemis lunar / Mars transit. Changes escalation wording, radiation rates,
// mission length and comms delay. Each option says what its length covers.
export default function MissionMenu() {
  const mission = useAppStore(selectMission)
  const choose = useAppStore((s) => s.selectMission)

  return (
    <Menu label={mission.name} ariaLabel={`Mission: ${mission.name}`}>
      {(close) =>
        MISSION_LIST.map((option) => (
          <MenuItem
            key={option.id}
            checked={option.id === mission.id}
            onSelect={() => {
              choose(option.id)
              close()
            }}
          >
            <span className="block">{option.name}</span>
            <span className="block text-xs text-text-muted">
              {option.lengthCovers} · {option.defaultLengthDays} days
            </span>
          </MenuItem>
        ))
      }
    </Menu>
  )
}
