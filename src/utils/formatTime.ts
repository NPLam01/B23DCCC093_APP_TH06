export const formatMessageTime = (ts: number): string => {
  if (!ts) return '';
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const formatConversationTime = (ts: number): string => {
  if (!ts) return '';
  const now = Date.now();
  const diff = now - ts;
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;

  if (diff < hr) return `${Math.max(1, Math.floor(diff / min))} ph`;
  if (diff < day) return `${Math.floor(diff / hr)} giờ`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} ngày`;
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

export const formatNotificationTime = (ts: number): string => {
  if (!ts) return '';
  const now = Date.now();
  const diff = now - ts;
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;

  if (diff < hr) return `${Math.max(1, Math.floor(diff / min))} phút trước`;
  if (diff < day) return `${Math.floor(diff / hr)} giờ trước`;
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

export const formatLastSeen = (ts?: number): string => {
  if (!ts) return 'Ngoại tuyến';
  const now = Date.now();
  const diff = now - ts;
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;

  if (diff < min) return 'Vừa mới hoạt động';
  if (diff < hr) return `Hoạt động ${Math.floor(diff / min)} phút trước`;
  if (diff < day) return `Hoạt động ${Math.floor(diff / hr)} giờ trước`;
  const d = new Date(ts);
  return `Hoạt động ngày ${d.getDate()}/${d.getMonth() + 1}`;
};
