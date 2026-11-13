import { useEffect, useRef, useState } from "react";
import { generateQr, type QrResult } from "fast-ts-qr";
import styles from "./qr-manager.module.css";

export type QrCustomization = {
  color: string;
  cornerRadius: number;
  logo: string | null;
};

type QrManagerProps = {
  text: string;
  customization: QrCustomization;
};

export const QrManager = ({ text, customization }: QrManagerProps) => {
  const [qrData, setQrData] = useState<QrResult | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text) {
      setQrData(null);
      return;
    }
    let cancelled = false;
    generateQr(text)
      .then((r) => {
        console.info("[QrManager] Resultado de generateQr:", {
          text,
          size: r.size,
          data: Array.from(r.data),
          result: r,
        });
        if (!cancelled) setQrData(r);
      })
      .catch((error) => {
        console.error("[QrManager] Error en generateQr:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!qrData || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { size } = qrData;
    const data = qrData.data;
    const { color, cornerRadius, logo } = customization;
    const renderScale = 10;
    const cellSize = renderScale;
    const radius = Math.min(Math.max(cornerRadius, 0), 0.5) * cellSize;

    canvas.width = canvas.height = size * renderScale;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;

    const finderPatterns = [
      [0, 0],
      [size - 7, 0],
      [0, size - 7],
    ];
    const isFinderPattern = (x: number, y: number) =>
      finderPatterns.some(
        ([finderX, finderY]) =>
          x >= finderX && x < finderX + 7 && y >= finderY && y < finderY + 7,
      );

    for (let i = 0; i < data.length; i++) {
      if (!data[i]) continue;
      const x = i % size;
      const y = Math.floor(i / size);
      if (isFinderPattern(x, y)) continue;
      const left = x * cellSize;
      const top = y * cellSize;

      if (radius === 0) {
        ctx.fillRect(left, top, cellSize, cellSize);
        continue;
      }

      ctx.beginPath();
      ctx.roundRect(left, top, cellSize, cellSize, radius);
      ctx.fill();
    }

    const finderRadius = Math.min(radius * 2, cellSize * 2);
    for (const [finderX, finderY] of finderPatterns) {
      const left = finderX * cellSize;
      const top = finderY * cellSize;
      const finderSize = cellSize * 7;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(left, top, finderSize, finderSize, finderRadius);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(left + cellSize, top + cellSize, cellSize * 5, cellSize * 5);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(
        left + cellSize * 2,
        top + cellSize * 2,
        cellSize * 3,
        cellSize * 3,
        Math.min(finderRadius / 2, cellSize),
      );
      ctx.fill();
    }

    if (!logo) return;

    const logoImage = new Image();
    let active = true;
    logoImage.onload = () => {
      if (!active) return;
      const maxLogoSize = canvas.width * 0.2;
      const aspectRatio = logoImage.naturalWidth / logoImage.naturalHeight;
      const logoWidth =
        aspectRatio >= 1 ? maxLogoSize : maxLogoSize * aspectRatio;
      const logoHeight =
        aspectRatio >= 1 ? maxLogoSize / aspectRatio : maxLogoSize;
      const logoX = (canvas.width - logoWidth) / 2;
      const logoY = (canvas.height - logoHeight) / 2;
      const padding = canvas.width * 0.025;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        logoX - padding,
        logoY - padding,
        logoWidth + padding * 2,
        logoHeight + padding * 2,
      );
      ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
    };
    logoImage.onerror = () => {
      console.error("[QrManager] No se pudo cargar el logo del QR.");
    };
    logoImage.src = logo;

    return () => {
      active = false;
    };
  }, [qrData, customization]);

  return (
    <div className={styles.qrManager}>
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          style={{
            width: 200,
            height: 200,
            imageRendering:
              customization.cornerRadius === 0 ? "pixelated" : "auto",
          }}
        />
        {!text && (
          <div className={styles.blurOverlay}>
            <p>Ingresa un texto para generar tu QR</p>
          </div>
        )}
      </div>
    </div>
  );
};
