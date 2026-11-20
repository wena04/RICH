import { Alert, Platform } from 'react-native';

import { type Dialogs, showWebAlert } from './webAlertCore';

/** Installs the browser dialogs behind `Alert.alert` on web. No-op on iOS and Android. */
export function installWebAlert() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const dialogs: Dialogs = {
    alert: (message) => window.alert(message),
    confirm: (message) => window.confirm(message),
  };
  Alert.alert = (title, message, buttons) =>
    showWebAlert(dialogs, title, message, buttons?.map((b) => ({ text: b.text, style: b.style, onPress: () => b.onPress?.() })));
}
