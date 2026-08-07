import { Redirect } from 'expo-router';

// This is a placeholder tab for the center FAB button
// It immediately redirects to the add transaction screen
export default function AddPlaceholder() {
  return <Redirect href="/transaction/new" />;
}
