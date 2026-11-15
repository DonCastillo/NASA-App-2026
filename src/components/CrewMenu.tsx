import { useNavigate } from 'react-router'
import { selectProfiles } from '../state/selectors'
import { useAppStore } from '../state/useAppStore'
import Menu, { MenuDivider, MenuItem, MenuLabel } from './Menu'

// Crew ▾ (plan/site-map.md → Navigation): switch whose data is shown, add or edit a profile.
// Switching never deletes anything; each profile keeps its own data.
export default function CrewMenu() {
  const profiles = useAppStore(selectProfiles)
  const selectedId = useAppStore((s) => s.selectedProfileId)
  const selectProfile = useAppStore((s) => s.selectProfile)
  const navigate = useNavigate()

  const selected = profiles.find((p) => p.id === selectedId)
  const demo = profiles.filter((p) => p.isDemo)
  const mine = profiles.filter((p) => !p.isDemo)

  return (
    <Menu
      label={<span className="max-w-[9rem] truncate">{selected?.name ?? 'Crew'}</span>}
      ariaLabel={`Crew member: ${selected?.name ?? 'none'}`}
    >
      {(close) => (
        <>
          {mine.length > 0 && (
            <>
              <MenuLabel>Your profiles</MenuLabel>
              {mine.map((profile) => (
                <MenuItem
                  key={profile.id}
                  checked={profile.id === selectedId}
                  onSelect={() => {
                    selectProfile(profile.id)
                    close()
                  }}
                >
                  {profile.name}
                </MenuItem>
              ))}
              <MenuDivider />
            </>
          )}
          <MenuLabel>Demo crew</MenuLabel>
          {demo.map((profile) => (
            <MenuItem
              key={profile.id}
              checked={profile.id === selectedId}
              onSelect={() => {
                selectProfile(profile.id)
                close()
              }}
            >
              {profile.name}
            </MenuItem>
          ))}
          <MenuDivider />
          <MenuItem
            onSelect={() => {
              close()
              navigate('/setup?new=1')
            }}
          >
            + Add crew member
          </MenuItem>
          {selected && !selected.isDemo && (
            <MenuItem
              onSelect={() => {
                close()
                navigate('/setup')
              }}
            >
              Edit profile
            </MenuItem>
          )}
        </>
      )}
    </Menu>
  )
}
