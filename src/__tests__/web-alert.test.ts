import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { showWebAlert } from '../platform/webAlertCore';

function dialogs(answer: boolean) {
  const shown: string[] = [];
  return {
    shown,
    alert: (m: string) => void shown.push(`alert:${m}`),
    confirm: (m: string) => (shown.push(`confirm:${m}`), answer),
  };
}

describe('web alerts', () => {
  it('shows a notice and runs its button', () => {
    const d = dialogs(true);
    let ran = false;
    showWebAlert(d, '保存失败', '请稍后再试', [{ text: '好', onPress: () => (ran = true) }]);
    assert.deepEqual(d.shown, ['alert:保存失败\n\n请稍后再试']);
    assert.ok(ran);
  });
  it('confirms a destructive action', () => {
    const calls: string[] = [];
    const buttons = [
      { text: '取消', style: 'cancel' as const, onPress: () => calls.push('cancel') },
      { text: '删除', style: 'destructive' as const, onPress: () => calls.push('delete') },
    ];
    showWebAlert(dialogs(true), '删除「吃饭」？', undefined, buttons);
    showWebAlert(dialogs(false), '删除「吃饭」？', undefined, buttons);
    assert.deepEqual(calls, ['delete', 'cancel']);
  });
  it('works without buttons', () => {
    const d = dialogs(true);
    showWebAlert(d, '已导出');
    assert.deepEqual(d.shown, ['alert:已导出']);
  });
});
