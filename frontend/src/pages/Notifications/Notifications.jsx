import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Card from '../../components/Card';
import { useToast } from '../../context/ToastContext';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const showToast = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    API.get('/notifications').then(res => setNotifications(res.data)).catch(console.error);
  };

  const handleAction = async (id, action) => {
    await API.post(`/notifications/${id}/action`, { action });
    showToast(`Invite ${action}ed!`, action === 'accept' ? 'success' : 'error');
    fetchNotifications();
  };

  const markAllRead = async () => {
    await API.post('/notifications/read-all');
    fetchNotifications();
    showToast('All marked as read.', 'success');
  };

  const getIcon = (type) => {
    switch(type) {
      case 'invite': return '💌';
      case 'match': return '🎉';
      case 'system': return '🔔';
      case 'message': return '💬';
      default: return '📌';
    }
  };

  return (
    <div className="notif-page hide-scrollbars">
      <div className="notif-container">
        <div className="notif-header">
          <h2>Notifications</h2>
          <button className="btn btn-ghost" onClick={markAllRead}>✓ Mark all as read</button>
        </div>

        <div className="notif-list">
          {notifications.length === 0 && (
            <div className="empty-state">
              <div style={{fontSize:'40px'}}>📭</div>
              <p>You're all caught up!</p>
            </div>
          )}
          {notifications.map(n => (
            <Card key={n.id} className={`notif-card ${n.read ? 'read' : 'unread'}`}>
              <div className="n-icon">{getIcon(n.type)}</div>
              <div className="n-content">
                <div className="n-title">{n.title}</div>
                <div className="n-message">{n.message}</div>
                <div className="n-time">{n.time}</div>
                
                {n.actionRequired && (
                  <div className="n-actions">
                    <button className="btn btn-primary small-btn" onClick={() => handleAction(n.id, 'accept')}>Accept</button>
                    <button className="btn btn-ghost small-btn" onClick={() => handleAction(n.id, 'decline')}>Decline</button>
                  </div>
                )}
              </div>
              {!n.read && <div className="n-unread-dot"></div>}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
