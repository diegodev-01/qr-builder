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
  onReadyChange?: (ready: boolean) => void;
};

export type QrManagerHandle = {
  copyPng: () => Promise<void>;
  copySvg: () => Promise<void>;
  downloadPng: () => Promise<void>;
  downloadSvg: () => Promise<void>;
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
  ({ text, customization, onReadyChange }, ref) => {
    const [qrData, setQrData] = useState<QrResult | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (!text) {
        setQrData(null);
        onReadyChange?.(false);
        return;
      }
      setQrData(null);
      onReadyChange?.(false);
      let cancelled = false;
      generateQr(text)
        .then((r) => {
          if (!cancelled) {
            setQrData(r);
          }
        })
        .catch((error) => {
          if (!cancelled) onReadyChange?.(false);
          console.error("[QrManager] Error en generateQr:", error);
        });
      return () => {
        cancelled = true;
      };
    }, [text, onReadyChange]);

    useEffect(() => {
      onReadyChange?.(Boolean(text && qrData));
    }, [text, qrData, onReadyChange]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!qrData || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { size } = qrData;
      const data = qrData.data;
      const { color, cornerRadius, logo } = customization;
      const renderScale = Math.max(16, Math.ceil(2048 / size));
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
        throw new Error("El QR todavía no está listo.");
      }

      try {
        const exportCanvas = createPaddedCanvas(canvas);
        const blob = await new Promise<Blob>((resolve, reject) => {
          exportCanvas.toBlob(
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
        throw error;
      }
    };

    const downloadPng = async () => {
      const canvas = canvasRef.current;
      if (!canvas || !qrData) {
        throw new Error("El QR todavía no está listo.");
      }

      const exportCanvas = createPaddedCanvas(canvas);
      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (result) =>
            result
              ? resolve(result)
              : reject(new Error("No se pudo crear el PNG.")),
          "image/png",
        );
      });
      downloadBlob(blob, "qr-code.png");
    };

    const createPaddedCanvas = (source: HTMLCanvasElement) => {
      const exportSize = 2048;
      const qrSize = Math.round(exportSize * 0.84);
      const padding = Math.round((exportSize - qrSize) / 2);
      const cornerRadius = Math.round(exportSize * 0.08);
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;
      const ctx = exportCanvas.getContext("2d");

      if (!ctx) {
        throw new Error("No se pudo preparar la imagen del QR.");
      }

      ctx.clearRect(0, 0, exportSize, exportSize);
      ctx.beginPath();
      ctx.roundRect(0, 0, exportSize, exportSize, cornerRadius);
      ctx.clip();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportSize, exportSize);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(source, padding, padding, qrSize, qrSize);

      return exportCanvas;
    };

    const rasterizeLogo = (source: string) =>
      new Promise<string>((resolve, reject) => {
        const logoImage = new Image();
        logoImage.onload = () => {
          const maxSize = 512;
          const aspectRatio =
            logoImage.naturalWidth / logoImage.naturalHeight;
          const width =
            aspectRatio >= 1 ? maxSize : Math.round(maxSize * aspectRatio);
          const height =
            aspectRatio >= 1 ? Math.round(maxSize / aspectRatio) : maxSize;
          const logoCanvas = document.createElement("canvas");
          logoCanvas.width = width;
          logoCanvas.height = height;
          const ctx = logoCanvas.getContext("2d");

          if (!ctx) {
            reject(new Error("No se pudo procesar el logo."));
            return;
          }

          ctx.drawImage(logoImage, 0, 0, width, height);
          resolve(logoCanvas.toDataURL("image/png"));
        };
        logoImage.onerror = () =>
          reject(new Error("No se pudo cargar el logo del QR."));
        logoImage.src = source;
      });

    const createSvg = async () => {
      if (!qrData) return null;

      const { size, data } = qrData;
      const { color, cornerRadius, logo } = customization;
      const borderPadding = size * 0.08;
      const exportSize = size + borderPadding * 2;
      const outerRadius = exportSize * 0.08;
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
        let embeddedLogo = logo;
        try {
          embeddedLogo = await rasterizeLogo(logo);
        } catch (error) {
          console.error("[QrManager] Error al incrustar el logo:", error);
        }

        const logoImage = new Image();
        logoImage.src = logo;
        await new Promise<void>((resolve) => {
          if (logoImage.complete) {
            resolve();
          } else {
            logoImage.onload = () => resolve();
            logoImage.onerror = () => resolve();
          }
        });

        const maxLogoSize = size * 0.2;
        const aspectRatio =
          logoImage.naturalWidth > 0 && logoImage.naturalHeight > 0
            ? logoImage.naturalWidth / logoImage.naturalHeight
            : 1;
        const logoWidth =
          aspectRatio >= 1 ? maxLogoSize : maxLogoSize * aspectRatio;
        const logoHeight =
          aspectRatio >= 1 ? maxLogoSize / aspectRatio : maxLogoSize;
        const logoX = (size - logoWidth) / 2;
        const logoY = (size - logoHeight) / 2;
        const padding = size * 0.025;
        logoSvg =
          `<rect x="${logoX - padding}" y="${logoY - padding}" ` +
          `width="${logoWidth + padding * 2}" height="${logoHeight + padding * 2}" ` +
          `rx="${padding}" ry="${padding}" fill="#ffffff"/>` +
          `<image href="${escapeXml(embeddedLogo)}" x="${logoX}" y="${logoY}" ` +
          `width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMidYMid meet"/>`;
      }

      return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${exportSize * 10}" height="${exportSize * 10}" viewBox="0 0 ${exportSize} ${exportSize}" shape-rendering="crispEdges">`,
        `<rect width="${exportSize}" height="${exportSize}" rx="${outerRadius}" ry="${outerRadius}" fill="#ffffff"/>`,
        `<g transform="translate(${borderPadding} ${borderPadding})">`,
        `<rect width="${size}" height="${size}" fill="#ffffff"/>`,
        `<g fill="${escapeXml(color)}">`,
        modules.join(""),
        `</g>`,
        finders.join(""),
        logoSvg,
        `</g>`,
        `</svg>`,
      ].join("");
    };

    const copySvg = async () => {
      try {
        const svg = await createSvg();
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
        throw error;
      }
    };

    const downloadSvg = async () => {
      const svg = await createSvg();
      if (!svg) {
        throw new Error("El QR todavía no está listo.");
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
              imageRendering: "auto",
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
