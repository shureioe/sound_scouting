const JSPDF_CDN_URL =
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';

type JsPdfConstructor = new (options?: {
  unit?: string;
  format?: string | [number, number];
  orientation?: 'portrait' | 'landscape';
}) => JsPdfInstance;

export type JsPdfInstance = {
  setFontSize: (size: number) => void;
  text: (text: string | string[], x: number, y: number) => void;
  splitTextToSize: (text: string, maxSize: number) => string[];
  addPage: () => void;
  addImage: (
    imageData: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  setDrawColor: (color: number) => void;
  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  output: (type: 'blob') => Blob;
};

export const createPdfDocument = async (): Promise<JsPdfInstance> => {
  const jspdfModule = (await import(/* webpackIgnore: true */ JSPDF_CDN_URL)) as {
    jsPDF: JsPdfConstructor;
  };
  return new jspdfModule.jsPDF({ unit: 'mm', format: 'a4' });
};

export const getImageFormatFromDataUrl = (dataUrl: string): 'PNG' | 'JPEG' => {
  if (dataUrl.startsWith('data:image/png')) {
    return 'PNG';
  }
  return 'JPEG';
};

export const loadImageDimensions = (
  dataUrl: string,
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = () => {
      reject(new Error('No se pudo cargar la imagen.'));
    };
    image.src = dataUrl;
  });

export const downloadPdfDocument = (doc: JsPdfInstance, filename: string) => {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
