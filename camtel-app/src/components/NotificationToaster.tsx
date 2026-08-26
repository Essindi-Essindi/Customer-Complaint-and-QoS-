import { useNotifications } from '../context/NotificationContext';
import { Toast } from './Toast';

// render toast stack
export function NotificationToaster() {
  const { popups, dismissPopup } = useNotifications();

  if (popups.length === 0) return null;

  return (
    <div className="notification-toaster">
      {popups.map((p) => (
        <Toast key={p.id} message={p.message} onClose={() => dismissPopup(p.id)} duration={6000} />
      ))}
    </div>
  );
}
