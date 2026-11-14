import { useState } from "react";
import { QrManager, type QrCustomization } from "./qr-manager";
import styles from "./qr-builder.module.css";

export function QrBuilder({ initialText = "" }: { initialText?: string }) {
  const [input, setInput] = useState(initialText);
  const [text, setText] = useState(initialText);
  const [customization, setCustomization] = useState<QrCustomization>({
    color: "#000000",
    cornerRadius: 0,
    logo: null,
  });

  const updateCustomization = <K extends keyof QrCustomization>(
    key: K,
    value: QrCustomization[K],
  ) => {
    setCustomization((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className={styles.container}>
      <span className={styles.controls}>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            setText(input.trim());
          }}
        >
          <div className={styles.qrInput}>
            <input
              id="qr-text"
              name="text"
              type="text"
              className={styles.textInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: https://tubini.com.bo"
              required
            />
            <button type="submit" className={styles.buildButton}>
              Build
            </button>
          </div>
        </form>

        <div className={styles.customization}>
          <label htmlFor="qr-color">Color</label>
          <input
            id="qr-color"
            type="color"
            value={customization.color}
            onChange={(e) => updateCustomization("color", e.target.value)}
          />

          <article>
            <label htmlFor="qr-corner-radius">Bordes redondeados:</label>
            <input
              id="qr-corner-radius"
              type="checkbox"
              checked={customization.cornerRadius > 0}
              onChange={(e) =>
                updateCustomization("cornerRadius", e.target.checked ? 1000 : 0)
              }
            />
          </article>

          <label htmlFor="qr-logo">Logo central</label>
          <input
            id="qr-logo"
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") {
                  updateCustomization("logo", reader.result);
                }
              };
              reader.onerror = () =>
                console.error("[QrBuilder] No se pudo leer el logo.");
              reader.readAsDataURL(file);
            }}
          />
          {customization.logo && (
            <button
              type="button"
              onClick={() => updateCustomization("logo", null)}
            >
              Quitar logo
            </button>
          )}
        </div>
      </span>

      <article className={styles.qrPreview}>
        <QrManager text={text} customization={customization} />
        <p className={styles.blurOverlayText}>{text}</p>
      </article>
    </div>
  );
}
