import styles from "./qr-text-form.module.css";

type QrTextFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function QrTextForm({ value, onChange, onSubmit }: QrTextFormProps) {
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className={styles.field}>
        <input
          id="qr-text"
          name="text"
          type="text"
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: https://tubini.com.bo"
          required
        />
        <button type="submit" className={styles.button}>
          Build
        </button>
      </div>
    </form>
  );
}
