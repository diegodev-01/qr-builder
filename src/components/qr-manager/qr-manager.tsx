import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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

export type QrManagerHandle = {
  copyPng: () => Promise<void>;
  copySvg: () => Promise<void>;
  downloadPng: () => void;
  downloadSvg: () => void;
  isReady: () => boolean;
};

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const QrManager = forwardRef<QrManagerHandle, QrManagerProps>(
  ({ text, customization }, ref) => {
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
        ctx.fillRect(
          left + cellSize,
          top + cellSize,
          cellSize * 5,
          cellSize * 5,
        );

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

    const copyPng = async () => {
      const canvas = canvasRef.current;
      if (!canvas || !qrData) {
        console.warn("[QrManager] El QR todavía no está listo.");
        return;
      }

      try {
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) =>
              result
                ? resolve(result)
                : reject(new Error("No se pudo crear el PNG.")),
            "image/png",
          );
        });

        if (
          !navigator.clipboard?.write ||
          typeof ClipboardItem === "undefined"
        ) {
          throw new Error("Tu navegador no permite copiar imágenes.");
        }

        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        console.info("[QrManager] PNG copiado.");
      } catch (error) {
        console.error("[QrManager] Error al copiar PNG:", error);
      }
    };

    const downloadPng = () => {
      const canvas = canvasRef.current;
      if (!canvas || !qrData) {
        console.warn("[QrManager] El QR todavía no está listo.");
        return;
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("[QrManager] No se pudo crear el PNG.");
          return;
        }
        downloadBlob(blob, "qr-code.png");
      }, "image/png");
    };

    const createSvg = () => {
      if (!qrData) return null;

      const { size, data } = qrData;
      const { color, cornerRadius, logo } = customization;
      const radius = Math.min(Math.max(cornerRadius, 0), 0.5);
      const moduleRadius = radius;
      const finderRadius = Math.min(radius * 2, 2);
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

      const modules: string[] = [];
      for (let i = 0; i < data.length; i++) {
        if (!data[i]) continue;
        const x = i % size;
        const y = Math.floor(i / size);
        if (isFinderPattern(x, y)) continue;
        modules.push(
          `<rect x="${x}" y="${y}" width="1" height="1"${
            moduleRadius > 0 ? ` rx="${moduleRadius}" ry="${moduleRadius}"` : ""
          }/>`,
        );
      }

      const finders: string[] = [];
      for (const [finderX, finderY] of finderPatterns) {
        finders.push(
          `<rect x="${finderX}" y="${finderY}" width="7" height="7" rx="${finderRadius}" ry="${finderRadius}" fill="${escapeXml(color)}"/>`,
          `<rect x="${finderX + 1}" y="${finderY + 1}" width="5" height="5" fill="#ffffff"/>`,
          `<rect x="${finderX + 2}" y="${finderY + 2}" width="3" height="3" rx="${Math.min(
            finderRadius / 2,
            1,
          )}" ry="${Math.min(
            finderRadius / 2,
            1,
          )}" fill="${escapeXml(color)}"/>`,
        );
      }

      let logoSvg = "";
      if (logo) {
        const logoSize = size * 0.2;
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;
        const padding = size * 0.025;
        logoSvg =
          `<rect x="${logoX - padding}" y="${logoY - padding}" ` +
          `width="${logoSize + padding * 2}" height="${logoSize + padding * 2}" ` +
          `fill="#ffffff"/>` +
          `<image href="${escapeXml(logo)}" x="${logoX}" y="${logoY}" ` +
          `width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`;
      }

      return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 10}" height="${size * 10}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
        `<rect width="${size}" height="${size}" fill="#ffffff"/>`,
        `<g fill="${escapeXml(color)}">`,
        modules.join(""),
        `</g>`,
        finders.join(""),
        logoSvg,
        `</svg>`,
      ].join("");
    };

    const copySvg = async () => {
      try {
        const svg = createSvg();
        if (!svg) throw new Error("El QR todavía no está listo.");
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });

        if (
          navigator.clipboard?.write &&
          typeof ClipboardItem !== "undefined"
        ) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/svg+xml": blob }),
            ]);
            console.info("[QrManager] SVG copiado.");
            return;
          } catch {
            // Some browsers expose the API but do not support SVG image items.
          }
        }

        if (!navigator.clipboard?.writeText) {
          throw new Error("Tu navegador no permite copiar imágenes.");
        }
        await navigator.clipboard.writeText(svg);
        console.info("[QrManager] SVG copiado como texto.");
      } catch (error) {
        console.error("[QrManager] Error al copiar SVG:", error);
      }
    };

    const downloadSvg = () => {
      const svg = createSvg();
      if (!svg) {
        console.warn("[QrManager] El QR todavía no está listo.");
        return;
      }
      downloadBlob(
        new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
        "qr-code.svg",
      );
    };

    useImperativeHandle(
      ref,
      () => ({
        copyPng,
        copySvg,
        downloadPng,
        downloadSvg,
        isReady: () => Boolean(qrData && canvasRef.current),
      }),
      [qrData, copyPng, copySvg, downloadPng, downloadSvg],
    );

    return (
      <div className={styles.qrManager}>
        <div className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            style={{
              imageRendering:
                customization.cornerRadius === 0 ? "pixelated" : "auto",
            }}
          />
          {!text && (
            <div className={styles.blurOverlay}>
              <img src="/test-qr.png" alt="" className={styles.testQr} />
              <p className={styles.blurOverlayText}>
                Ingresa un texto para generar tu QR
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
);
