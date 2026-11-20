import type { QrCustomization } from "./qr-manager";
import { LogoUploader } from "./logo-uploader";
import styles from "./customization-panel.module.css";

type CustomizationPanelProps = {
  customization: QrCustomization;
  onChange: <K extends keyof QrCustomization>(
    key: K,
    value: QrCustomization[K],
  ) => void;
};

export function CustomizationPanel({
  customization,
  onChange,
}: CustomizationPanelProps) {
  return (
    <section className={styles.card} aria-label="Personalización del QR">
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
                onChange={(e) => onChange("color", e.target.value)}
              />
            </label>
          </span>
        </div>
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
              onChange("cornerRadius", e.target.checked ? 1000 : 0)
            }
          />
          <span className={styles.slider} />
        </label>
      </div>

      <hr className={styles.divider} />

      <LogoUploader
        logo={customization.logo}
        onChange={(logo) => onChange("logo", logo)}
      />
    </section>
  );
}
