import { useState, useRef } from "react";
import {
  QrManager,
  type QrCustomization,
  type QrManagerHandle,
} from "./qr-manager";
import styles from "./qr-builder.module.css";

export function QrBuilder({ initialText = "" }: { initialText?: string }) {
  const [input, setInput] = useState(initialText);
  const [text, setText] = useState(initialText);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrManagerRef = useRef<QrManagerHandle>(null);

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

  const processLogoFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateCustomization("logo", reader.result);
      }
    };
    reader.onerror = () =>
      console.error("[QrBuilder] No se pudo leer el logo.");
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    updateCustomization("logo", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

        {/* PANEL DE PERSONALIZACIÓN MEJORADO */}
        <section
          className={styles.customizationCard}
          aria-label="Personalización del QR"
        >
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Personalización</h2>
            <span className={styles.badge}>Estilo</span>
          </div>

          <div className={styles.controlGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="qr-color" className={styles.label}>
                Color del código
              </label>
              <span className={styles.helperColor}>
                <span className={styles.hexValue}>
                  {customization.color.toUpperCase()}
                </span>
                <label
                  htmlFor="qr-color"
                  className={styles.customColorBtn}
                  title="Elegir color personalizado"
                >
                  <span
                    className={styles.colorWheelIcon}
                    style={{ backgroundColor: customization.color }}
                  />
                  <input
                    id="qr-color"
                    type="color"
                    className={styles.hiddenColorInput}
                    value={customization.color}
                    onChange={(e) =>
                      updateCustomization("color", e.target.value)
                    }
                  />
                </label>
              </span>
            </div>

            <div className={styles.colorControls}></div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.switchRow}>
            <div className={styles.switchText}>
              <label htmlFor="qr-corner-radius" className={styles.label}>
                Bordes redondeados
              </label>
              <span className={styles.helperText}>
                Suaviza las esquinas de los módulos del QR
              </span>
            </div>

            <label className={styles.switch}>
              <input
                id="qr-corner-radius"
                type="checkbox"
                checked={customization.cornerRadius > 0}
                onChange={(e) =>
                  updateCustomization(
                    "cornerRadius",
                    e.target.checked ? 1000 : 0,
                  )
                }
              />
              <span className={styles.slider} />
            </label>
          </div>

          <hr className={styles.divider} />

          <div className={styles.controlGroup}>
            <div className={styles.labelRowLogo}>
              <label htmlFor="qr-logo" className={styles.label}>
                Logo central
              </label>
              <span className={styles.helperText}>PNG, SVG, WEBP</span>
            </div>

            <input
              ref={fileInputRef}
              id="qr-logo"
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className={styles.hiddenFileInput}
              onChange={(e) => processLogoFile(e.target.files?.[0])}
            />

            {!customization.logo ? (
              <div
                role="button"
                tabIndex={0}
                className={`${styles.dropzone} ${
                  isDragging ? styles.dropzoneDragging : ""
                }`}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  processLogoFile(e.dataTransfer.files?.[0]);
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className={styles.dropzoneText}>
                  <strong>Sube un logo</strong> o arrástralo aquí
                </p>
              </div>
            ) : (
              <div className={styles.logoPreviewCard}>
                <div className={styles.logoThumbnailWrapper}>
                  <img
                    src={customization.logo}
                    alt="Vista previa del logo"
                    className={styles.logoThumbnail}
                  />
                </div>
                <div className={styles.logoActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    className={styles.dangerBtn}
                    onClick={handleRemoveLogo}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </span>

      <article className={styles.qrPreview}>
        <p className={styles.blurOverlayText}>{text}</p>
        <QrManager
          ref={qrManagerRef}
          text={text}
          customization={customization}
        />
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.copyButton}
            onClick={() => qrManagerRef.current?.copyPng()}
            disabled={!text}
          >
            Copiar PNG
          </button>
          <button
            type="button"
            className={styles.downloadButton}
            onClick={() => qrManagerRef.current?.downloadPng()}
            disabled={!text}
          >
            Descargar PNG
          </button>
          <button
            type="button"
            className={styles.copyButton}
            onClick={() => qrManagerRef.current?.copySvg()}
            disabled={!text}
          >
            Copiar SVG
          </button>
          <button
            type="button"
            className={styles.downloadButton}
            onClick={() => qrManagerRef.current?.downloadSvg()}
            disabled={!text}
          >
            Descargar SVG
          </button>
        </div>
      </article>
    </div>
  );
}
