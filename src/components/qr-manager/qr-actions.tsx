import type { QrManagerHandle } from "./qr-manager";
import styles from "./qr-actions.module.css";

type QrActionsProps = {
  disabled: boolean;
  getHandle: () => QrManagerHandle | null;
  onRun: (
    action: () => void | Promise<void> | undefined,
    successMessage: string,
  ) => void;
};

const FORMATS = [
  {
    label: "PNG",
    copy: { method: "copyPng", message: "PNG copiado al portapapeles." },
    download: { method: "downloadPng", message: "PNG descargado." },
  },
  {
    label: "SVG",
    copy: { method: "copySvg", message: "SVG copiado al portapapeles." },
    download: { method: "downloadSvg", message: "SVG descargado." },
  },
] as const;

export function QrActions({ disabled, getHandle, onRun }: QrActionsProps) {
  const title = disabled ? "Genera primero un QR" : undefined;

  return (
    <div className={styles.actions}>
      {FORMATS.map(({ label, copy, download }) => (
        <div key={label} className={styles.row}>
          <span className={styles.format}>{label}</span>
          <button
            type="button"
            className={styles.copy}
            disabled={disabled}
            title={title}
            onClick={() => onRun(() => getHandle()?.[copy.method](), copy.message)}
          >
            Copiar
          </button>
          <button
            type="button"
            className={styles.download}
            disabled={disabled}
            title={title}
            onClick={() =>
              onRun(() => getHandle()?.[download.method](), download.message)
            }
          >
            Descargar
          </button>
        </div>
      ))}
    </div>
  );
}
