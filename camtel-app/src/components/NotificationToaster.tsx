import { useNotifications } from '../context/NotificationContext';
import { Toast } from './Toast';

// Stacks a Toast popup per newly-arrived notification, regardless of which
// page the user is currently on — mounted once at the app root inside
// AuthProvider/NotificationProvider. Stays empty (renders nothing) until an
// event actually concerns the logged-in subscriber/agent/manager.
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
