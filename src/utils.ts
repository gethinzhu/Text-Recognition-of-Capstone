const ALLOWED_FILE_TYPES = ['image/tiff', 'image/tif', 'image/png', 'image/jpeg', 'image/jpg'];

const ALLOWED_EXTENSIONS = ['.tiff', '.tif', '.png', '.jpg', '.jpeg'];

export function isValidFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

export function isValidFileExtension(fileName: string): boolean {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!isValidFileType(file)) {
    return {
      valid: false,
      error: `Ungültiger Dateityp: ${file.type}. Erlaubt sind: TIFF, PNG, JPG.`,
    };
  }

  if (!isValidFileExtension(file.name)) {
    return {
      valid: false,
      error: `Ungültige Dateierweiterung. Erlaubt sind: TIFF, PNG, JPG.`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const maxSize = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function simulateOcrProcessing(
  _fileId: string,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const duration = 2000 + Math.random() * 1000;
    const intervalMs = 100;
    const totalSteps = Math.floor(duration / intervalMs);
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = (currentStep / totalSteps) * 100;
      onProgress(progress);

      if (currentStep >= totalSteps) {
        clearInterval(interval);

        if (Math.random() > 0.1) {
          resolve(generateSampleOcrText());
        } else {
          reject(new Error('OCR-Verarbeitung fehlgeschlagen'));
        }
      }
    }, intervalMs);
  });
}

function generateSampleOcrText(): string {
  const samples = [
    `Deutsche Zeitung
Berlin, 15. März 1932

Die wirtschaftliche Lage im Deutschen Reich zeigt Anzeichen einer leichten Besserung. Die Industrieproduktion ist im Vergleich zum Vorjahr um 3,5 Prozent gestiegen. Experten sehen darin einen Hoffnungsschimmer für die kommenden Monate.

Die Arbeitslosenzahlen bleiben jedoch weiterhin auf einem besorgniserregend hohen Niveau. Rund fünf Millionen Menschen sind ohne Beschäftigung. Die Regierung kündigte neue Maßnahmen zur Bekämpfung der Arbeitslosigkeit an.

Im Bereich der Kultur gibt es interessante Neuigkeiten. Das neue Theaterstück "Der Weg nach unten" sorgt für Diskussionen in der Hauptstadt. Die Premiere war ausverkauft und die Kritiken sind gemischt.

Die politische Landschaft bleibt fragmentiert. Verschiedene Parteien kämpfen um die Gunst der Wähler. Die kommenden Wahlen werden richtungsweisend für die Zukunft des Landes sein.`,

    `Nachrichten aus aller Welt
London, 10. Juni 1931

Die internationale Konferenz zur Wirtschaftskrise hat heute ihre Arbeit aufgenommen. Vertreter aus über zwanzig Ländern sind erschienen, um über gemeinsame Lösungsansätze zu beraten.

In Paris wurde bekannt gegeben, dass die französische Industrie ihre Produktion steigern konnte. Der Index stieg um 2,3 Prozent. Dies wird als positives Signal für die europäische Wirtschaft gewertet.

Die amerikanische Börse zeigt weiterhin starke Schwankungen. Analysten warnen vor weiteren Turbulenzen. Die Auswirkungen auf die europäischen Märkte bleiben abzuwarten.

Wissenschaftler entdecken neue Erkenntnisse über die Struktur der Materie. Die Forschung verspricht bedeutende Fortschritte in der Physik.`,

    `Lokalanzeiger
München, 22. August 1933

Das städtische Theater präsentiert in dieser Woche eine neue Inszenierung. "Die heitere Wissenschaft" lautet der Titel des Stücks, das bereits in anderen Städten große Erfolge feierte.

Die Stadtverwaltung hat neue Bauvorhaben angekündigt. Im Süden der Stadt sollen neue Wohnhäuser entstehen. Die Bauarbeiten sollen im nächsten Monat beginnen.

Das Wetter der letzten Woche war wechselhaft. Die Landwirtschaft rechnet mit einer durchschnittlichen Ernte. Die Preise für landwirtschaftliche Produkte bleiben stabil.

Verschiedene Vereine laden zu ihren Veranstaltungen ein. Der Gesangverein feiert sein 50-jähriges Bestehen mit einem großen Konzert.`,
  ];

  return samples[Math.floor(Math.random() * samples.length)];
}

export function createDownloadFile(text: string, fileName: string): void {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function createDownloadZip(files: { name: string; content: string }[]): void {
  const content = files.map(f => f.content).join('\n\n---\n\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ocr-results.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
