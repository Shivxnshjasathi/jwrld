import { useEffect } from 'react';

/**
 * A hook that intercepts the browser's back button when a modal is open.
 * Instead of navigating backward in history, it fires the provided `onClose` callback,
 * giving a native app-like experience where the "back" gesture dismisses the active modal or bottom sheet.
 *
 * @param isOpen Whether the modal is currently visible
 * @param onClose Callback to fire when the back button is pressed
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    // Push a dummy state to history when the modal opens
    // This allows us to catch the back event without actually leaving the page
    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      // The back button was pressed, removing the dummy state
      // We prevent default behavior and close the modal instead
      e.preventDefault();
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      
      // If the modal unmounts or closes normally (e.g. they clicked a close button),
      // we need to clean up the dummy state we pushed so it doesn't pollute history.
      // We check if the state is still our dummy state before popping.
      if (window.history.state && window.history.state.modalOpen) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
}
