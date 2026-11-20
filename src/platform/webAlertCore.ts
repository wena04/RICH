/** The parts of a React Native AlertButton the browser mapping needs. */
export type AlertButtonLike = { text?: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };

export type Dialogs = {
  alert: (message: string) => void;
  confirm: (message: string) => boolean;
};

function text(title: string, message?: string) {
  return message ? `${title}\n\n${message}` : title;
}

/**
 * React Native Web's `Alert.alert` does nothing, so every confirmation (delete a budget, a record,
 * restore a backup…) was a dead button in the browser preview. This maps an Alert onto the
 * browser's own dialogs: one button → `alert`, a cancel plus one action → `confirm`.
 */
export function showWebAlert(dialogs: Dialogs, title: string, message?: string, buttons?: AlertButtonLike[]) {
  const list = buttons?.length ? buttons : [{ text: 'OK' }];
  const cancel = list.find((b) => b.style === 'cancel');
  const actions = list.filter((b) => b !== cancel);
  if (actions.length === 0 || (actions.length === 1 && !cancel)) {
    dialogs.alert(text(title, message));
    (actions[0] ?? cancel)?.onPress?.();
    return;
  }
  // The browser offers OK/Cancel only: OK runs the last action (the decisive one in every alert
  // this app shows), Cancel runs the cancel button.
  if (dialogs.confirm(text(title, message))) actions[actions.length - 1].onPress?.();
  else cancel?.onPress?.();
}
