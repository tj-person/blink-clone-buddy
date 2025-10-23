import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay = ({ url, size = 200, className }: QRCodeDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) console.error("QR Code generation error:", error);
        }
      );

      QRCode.toDataURL(url, { width: size }, (err, dataUrl) => {
        if (!err) setQrDataUrl(dataUrl);
      });
    }
  }, [url, size]);

  const handleDownload = () => {
    if (qrDataUrl) {
      const link = document.createElement("a");
      link.download = "card-qr-code.png";
      link.href = qrDataUrl;
      link.click();
    }
  };

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="mx-auto" />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="mt-4 w-full"
      >
        <Download className="h-4 w-4 mr-2" />
        Download QR Code
      </Button>
    </div>
  );
};