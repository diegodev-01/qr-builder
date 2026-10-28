import { useState } from "react";
import { QrManager } from "./qr-manager";

export function QrBuilder({ initialText = "" }: { initialText?: string }) {
  const [input, setInput] = useState(initialText);
  const [text, setText] = useState(initialText);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setText(input.trim());
        }}
      >
        <label htmlFor="qr-text">Enter text for the QR code</label>
        <input
          id="qr-text"
          name="text"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://tubini.com.bo"
          required
        />
        <button type="submit">Generar</button>
      </form>

      {text && <QrManager text={text} />}
    </div>
  );
}