/**
 * 클라이언트에서 업로드 이미지를 JPEG data URL로 리사이즈·압축 (디자이너/반려동물 프로필 등 공통)
 */
export async function compressImageFileToJpegDataUrl(
  file: File,
  opts?: { maxEdge?: number; quality?: number }
): Promise<string> {
  const maxEdge = opts?.maxEdge ?? 400;
  const quality = opts?.quality ?? 0.82;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxEdge || h > maxEdge) {
          if (w > h) {
            h = (h * maxEdge) / w;
            w = maxEdge;
          } else {
            w = (w * maxEdge) / h;
            h = maxEdge;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
