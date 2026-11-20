import { useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { QrManager, type QrCustomization, type QrManagerHandle } from "./qr-manager";
import { QrTextForm } from "./qr-text-form";
import { CustomizationPanel } from "./customization-panel";
import { QrActions } from "./qr-actions";
import styles from "./qr-builder.module.css";

export function QrBuilder({ initialText = "" }: { initialText?: string }) {
  const [input, setInput] = useState(initialText);
  const [text, setText] = useState(initialText);
  const [isQrReady, setIsQrReady] = useState(false);
  const qrManagerRef = useRef<QrManagerHandle>(null);

  const [customization, setCustomization] = useState<QrCustomization>({
    color: "#000000",
    cornerRadius: 0,
    logo: null,
  });

  const updateCustomization = <K extends keyof QrCustomization>(
    key: K,
    value: QrCustomization[K],
  ) => setCustomization((current) => ({ ...current, [key]: value }));

  const handleBuild = () => {
    const nextText = input.trim();
    if (!nextText) {
      toast.error("Ingresa un texto para generar el QR.");
      return;
    }
    // QrManager reports readiness itself when `text` changes. Resetting it for
    // an unchanged text would leave the actions disabled, since nothing re-runs.
    if (nextText !== text) {
      setText(nextText);
      setIsQrReady(false);
    }
    toast.success("QR generado.");
  };

  const runQrAction = async (
    action: () => void | Promise<void> | undefined,
    successMessage: string,
  ) => {
    if (!isQrReady) {
      toast.error("Genera primero un QR para continuar.");
      return;
    }

    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo completar la acción.",
      );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <QrTextForm value={input} onChange={setInput} onSubmit={handleBuild} />
        <CustomizationPanel
          customization={customization}
          onChange={updateCustomization}
        />
      </div>

      <article className={styles.qrPreview}>
        {isQrReady && <p className={styles.previewText}>{text}</p>}
        <QrManager
          ref={qrManagerRef}
          text={text}
          customization={customization}
          onReadyChange={setIsQrReady}
        />
        {!isQrReady && (
          <p className={styles.actionHint} role="status">
            Genera un QR para habilitar las acciones
          </p>
        )}
        <QrActions
          disabled={!isQrReady}
          getHandle={() => qrManagerRef.current}
          onRun={runQrAction}
        />
      </article>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2600,
          style: { borderRadius: "10px", fontSize: "0.875rem" },
        }}
      />
    </div>
  );
}
