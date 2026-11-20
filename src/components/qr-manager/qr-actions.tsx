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

const ACTIONS = [
  { verb: "Copiar", format: "PNG", variant: "copy", method: "copyPng", message: "PNG copiado al portapapeles." },
  { verb: "Descargar", format: "PNG", variant: "download", method: "downloadPng", message: "PNG descargado." },
  { verb: "Copiar", format: "SVG", variant: "copy", method: "copySvg", message: "SVG copiado al portapapeles." },
  { verb: "Descargar", format: "SVG", variant: "download", method: "downloadSvg", message: "SVG descargado." },
] as const;

export function QrActions({ disabled, getHandle, onRun }: QrActionsProps) {
  const title = disabled ? "Genera primero un QR" : undefined;

  return (
    <div className={styles.actions}>
      {ACTIONS.map(({ verb, format, variant, method, message }) => (
        <button
          key={method}
          type="button"
          className={styles[variant]}
          disabled={disabled}
          title={title}
          onClick={() => onRun(() => getHandle()?.[method](), message)}
        >
          <span>{verb}</span> <span>{format}</span>
        </button>
      ))}
    </div>
  );
}
