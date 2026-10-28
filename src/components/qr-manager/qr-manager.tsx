import { useEffect, useRef, useState } from "react";
import { generateQr, type QrResult } from "fast-ts-qr";
import styles from "./qr-manager.module.css";

export const QrManager = ({ text }: { text: string }) => {
  const [qrData, setQrData] = useState<QrResult | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    generateQr(text)
      .then((r) => !cancelled && setQrData(r))
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!qrData || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { size } = qrData;
    const data = qrData.data;

    canvas.width = canvas.height = size;
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < data.length; i++) {
      const c = data[i] ? 0 : 255;
      img.data.set([c, c, c, 255], i * 4);
    }
    ctx.putImageData(img, 0, 0);
  }, [qrData]);

  return (
    <div className={styles.qrManager}>
      <p>QR Code</p>
      <span className="text-blue-500">{text}</span>
      <div>
        <canvas
          ref={canvasRef}
          style={{
            width: 200,
            height: 200,
            imageRendering: "pixelated",
          }}
        />
      </div>
    </div>
  );
};
