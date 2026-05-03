import { useLabourStore } from '../src/store/useLabourStore'
import { useLaborStore } from '../src/stores/laborStore'
import { useRecordingStore } from '../src/stores/recordingStore'
import { useSettingsStore } from '../src/stores/settingsStore'
import { useUserStore } from '../src/stores/userStore'

export function resetStores() {
  localStorage.clear()
  useLabourStore.setState(useLabourStore.getInitialState(), true)
  useLaborStore.setState(useLaborStore.getInitialState(), true)
  useRecordingStore.setState(useRecordingStore.getInitialState(), true)
  useSettingsStore.setState(useSettingsStore.getInitialState(), true)
  useUserStore.setState(useUserStore.getInitialState(), true)
}
