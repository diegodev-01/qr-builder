import { useRef, useState } from "react";
import toast from "react-hot-toast";
import styles from "./customization-panel.module.css";

type LogoUploaderProps = {
  logo: string | null;
  onChange: (logo: string | null) => void;
};

export function LogoUploader({ logo, onChange }: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => fileInputRef.current?.click();

  const processFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
        toast.success("Logo agregado.");
      }
    };
    reader.onerror = () => {
      console.error("[QrBuilder] No se pudo leer el logo.");
      toast.error("No se pudo leer el logo.");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Logo eliminado.");
  };

  return (
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
        onChange={(e) => processFile(e.target.files?.[0])}
      />

      {!logo ? (
        <div
          role="button"
          tabIndex={0}
          className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""}`}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
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
            processFile(e.dataTransfer.files?.[0]);
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
              src={logo}
              alt="Vista previa del logo"
              className={styles.logoThumbnail}
            />
          </div>
          <div className={styles.logoActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={openPicker}
            >
              Cambiar
            </button>
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={removeLogo}
            >
              Quitar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
