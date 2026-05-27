/**
 * 포맷팅 유틸리티
 */

/** Unix ms 타임스탬프 → 상대 시간 (예: 3분 전, 1시간 전) */
export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(timestamp).toLocaleDateString('ko-KR');
}

/** Unix ms → yyyy.MM.dd HH:mm */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 온도 표시 */
export function formatTemp(celsius: number): string {
  return `${celsius.toFixed(1)}°C`;
}
