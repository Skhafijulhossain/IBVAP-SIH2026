import type { AlertSeverity, DetectionType } from '../types';

export function formatConfidence(conf: number): string {
  return `${Math.round(conf * 100)}%`;
}

export function getSeverityBadgeClass(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse';
    case 'warning':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
    case 'info':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/40';
    default:
      return 'bg-slate-700/50 text-slate-300 border border-slate-600';
  }
}

export function getSeverityDotClass(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
    case 'warning':
      return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]';
    case 'info':
      return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]';
    default:
      return 'bg-slate-400';
  }
}

export function getDetectionTypeLabel(type: DetectionType): string {
  switch (type) {
    case 'person':
      return 'Person Detected';
    case 'vehicle':
      return 'Vehicle Detected';
    case 'intrusion':
      return 'Intrusion Alert';
    case 'line_crossing':
      return 'Tripwire / Line Crossing';
    case 'loitering':
      return 'Loitering Alert';
    case 'weapon':
      return 'Weapon / Threat Silhouette';
    case 'camera_offline':
      return 'Camera Feed Offline';
    case 'animal':
      return 'Wildlife Movement';
    default:
      return 'Detection Event';
  }
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            const raw = row[k];
            let cellStr = raw === null || raw === undefined ? '' : typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
            cellStr = cellStr.replace(/"/g, '""');
            if (cellStr.search(/("|,|\n)/g) >= 0) {
              cellStr = `"${cellStr}"`;
            }
            return cellStr;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportToJson(filename: string, data: unknown) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
