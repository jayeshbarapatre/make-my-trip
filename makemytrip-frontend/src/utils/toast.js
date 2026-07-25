// Simple toast notification helper using browser native approach
export const showToast = (message, type = 'info', duration = 3000) => {
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');

  // Color map based on type
  const colorMap = {
    success: { bg: 'hsl(var(--su))', text: 'hsl(var(--suc))', icon: '✓' },
    error: { bg: 'hsl(var(--er))', text: 'hsl(var(--erc))', icon: '✕' },
    warning: { bg: 'hsl(var(--wa))', text: 'hsl(var(--wac))', icon: '⚠' },
    info: { bg: 'hsl(var(--p))', text: 'hsl(var(--pc))', icon: 'ℹ' }
  };

  const colors = colorMap[type] || colorMap.info;

  toast.style.cssText = `
    background: ${colors.bg};
    color: ${colors.text};
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 14px;
    font-weight: 600;
    max-width: 380px;
    display: flex;
    align-items: center;
    gap: 10px;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    white-space: pre-wrap;
    word-break: break-word;
  `;

  toast.innerHTML = `<span>${colors.icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// Add animations if not already present
if (!document.querySelector('style[data-toast-animations]')) {
  const style = document.createElement('style');
  style.setAttribute('data-toast-animations', 'true');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

export default showToast;
