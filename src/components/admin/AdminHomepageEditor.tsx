"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  getHomepageContent,
  addGalleryItem,
  addGalleryItems,
  removeGalleryItem,
  addProductLink,
  removeProductLink,
  hydrateHomepageFromRemote,
  subscribeHomepageRemote,
} from "@/lib/homepage-content-storage";
import {
  getTips,
  addTip,
  updateTip,
  removeTip,
  getNotices,
  addNotice,
  updateNotice,
  removeNotice,
  hydrateTipsNoticesFromRemote,
  subscribeTipsNoticesRemote,
} from "@/lib/tips-notices-storage";
import type { TipItem, NoticeItem } from "@/lib/tips-notices-storage";

const MAX_IMAGE_SIZE = 800;
const IMAGE_QUALITY = 0.85;
const MAX_VIDEO_SIZE_MB = 2;
/** 제품 이미지용 (localStorage 용량 절약) */
const PRODUCT_IMAGE_SIZE = 200;
const PRODUCT_IMAGE_QUALITY = 0.7;

function compressImage(file: File, maxSize = MAX_IMAGE_SIZE, quality = IMAGE_QUALITY): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
          } else {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas error");
        ctx.drawImage(img, 0, 0, width, height);
        const isPng = file.type === "image/png";
        resolve(canvas.toDataURL(isPng ? "image/png" : "image/jpeg", isPng ? 0.9 : quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 로드 실패"));
    };
    img.src = url;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function AdminHomepageEditor() {
  const [content, setContent] = useState(getHomepageContent());
  const [tips, setTips] = useState(() => getTips());
  const [notices, setNotices] = useState(() => getNotices());
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [newGalleryTitle, setNewGalleryTitle] = useState("");
  const [newGalleryType, setNewGalleryType] = useState<"image" | "video">("image");
  const [newProductTitle, setNewProductTitle] = useState("");
  const [newProductUrl, setNewProductUrl] = useState("");
  const [newProductImageUrl, setNewProductImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [productError, setProductError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setContent(getHomepageContent());
    setTips(getTips());
    setNotices(getNotices());
  };

  useEffect(() => {
    let unsubHome: (() => void) | undefined;
    let unsubTips: (() => void) | undefined;
    (async () => {
      await Promise.all([hydrateHomepageFromRemote(), hydrateTipsNoticesFromRemote()]);
      refresh();
      unsubHome = subscribeHomepageRemote(refresh);
      unsubTips = subscribeTipsNoticesRemote(refresh);
    })();
    const onVisible = () => {
      void Promise.all([hydrateHomepageFromRemote(), hydrateTipsNoticesFromRemote()]).finally(refresh);
    };
    document.addEventListener("visibilitychange", onVisible);
    const onHomeEvt = () => refresh();
    const onTipsEvt = () => refresh();
    window.addEventListener("mimi_homepage_updated", onHomeEvt);
    window.addEventListener("mimi_tips_notices_updated", onTipsEvt);
    return () => {
      unsubHome?.();
      unsubTips?.();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("mimi_homepage_updated", onHomeEvt);
      window.removeEventListener("mimi_tips_notices_updated", onTipsEvt);
    };
  }, []);

  const handleAddGallery = () => {
    if (!newGalleryUrl.trim()) return;
    let url = newGalleryUrl.trim();
    if (newGalleryType === "video") {
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (m) url = `https://www.youtube.com/embed/${m[1]}`;
    }
    addGalleryItem({
      type: newGalleryType,
      url,
      title: newGalleryTitle.trim() || undefined,
    });
    setNewGalleryUrl("");
    setNewGalleryTitle("");
    refresh();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setUploadError("");
    try {
      const items: { type: "image" | "video"; url: string; title?: string }[] = [];
      for (const file of files) {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        if (!isImage && !isVideo) continue;
        let dataUrl: string;
        if (isImage) {
          dataUrl = await compressImage(file);
        } else {
          if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            setUploadError(`영상 ${file.name}은 ${MAX_VIDEO_SIZE_MB}MB 이하여야 합니다.`);
            continue;
          }
          dataUrl = await fileToDataUrl(file);
        }
        items.push({
          type: isImage ? "image" : "video",
          url: dataUrl,
          title: file.name.replace(/\.[^.]+$/, ""),
        });
      }
      if (items.length) addGalleryItems(items);
      refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveGallery = (id: string) => {
    removeGalleryItem(id);
    refresh();
  };

  const handleAddProduct = () => {
    if (!newProductTitle.trim() || !newProductUrl.trim()) {
      setProductError("제품명과 링크 URL을 입력해 주세요.");
      return;
    }
    setProductError("");
    let url = newProductUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
    const result = addProductLink({
      title: newProductTitle.trim(),
      url,
      imageUrl: newProductImageUrl.trim() || undefined,
    });
    if (!result.ok) {
      setProductError(result.error ?? "저장에 실패했습니다.");
      return;
    }
    setNewProductTitle("");
    setNewProductUrl("");
    setNewProductImageUrl("");
    refresh();
  };

  const handleRemoveProduct = (id: string) => {
    removeProductLink(id);
    refresh();
  };

  const handleUpdateTip = (id: string, updates: Partial<TipItem>) => {
    updateTip(id, updates);
    refresh();
  };

  const handleRemoveTip = (id: string) => {
    removeTip(id);
    refresh();
  };

  const handleAddTip = () => {
    const slug = `tip-${Date.now()}`;
    addTip({ title: "새 노하우", slug, content: "" });
    refresh();
  };

  const handleUpdateNotice = (id: string, updates: Partial<NoticeItem>) => {
    updateNotice(id, updates);
    refresh();
  };

  const handleRemoveNotice = (id: string) => {
    removeNotice(id);
    refresh();
  };

  const handleAddNotice = () => {
    const d = new Date();
    const date = `${String(d.getFullYear()).slice(-2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    addNotice({ type: "공지", title: "새 공지", date });
    refresh();
  };

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <h2 className="text-xl font-bold text-mimi-charcoal mb-2">갤러리 (강아지 사진·영상)</h2>
        <p className="text-sm text-mimi-slate mb-6">
          첫 화면 &quot;찾아가는 펫 미용 서비스&quot; 아래에 노출됩니다. 컴퓨터에서 파일을 올리거나 URL을 입력하세요.
        </p>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-mimi-charcoal mb-1">컴퓨터에서 업로드</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-stone-300 hover:border-mimi-primary/50 hover:bg-mimi-primary/5 transition-colors text-mimi-slate disabled:opacity-60"
            >
              {uploading ? "업로드 중..." : "📁 사진·영상 파일 선택 (여러 개 가능)"}
            </button>
            <p className="text-xs text-mimi-slate mt-1">이미지: 자동 압축 · 영상: {MAX_VIDEO_SIZE_MB}MB 이하</p>
            {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
          </div>
          <div className="border-t border-stone-200 pt-4">
            <p className="text-sm font-medium text-mimi-charcoal mb-2">또는 URL 입력</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-mimi-charcoal mb-1">유형</label>
            <select
              value={newGalleryType}
              onChange={(e) => setNewGalleryType(e.target.value as "image" | "video")}
              className="w-full px-4 py-2 rounded-lg border border-stone-200"
            >
              <option value="image">이미지</option>
              <option value="video">영상 (YouTube 등 임베드 URL)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-mimi-charcoal mb-1">URL *</label>
            <input
              type="url"
              value={newGalleryUrl}
              onChange={(e) => setNewGalleryUrl(e.target.value)}
              placeholder={newGalleryType === "image" ? "https://example.com/image.jpg" : "https://www.youtube.com/embed/..."}
              className="w-full px-4 py-2 rounded-lg border border-stone-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-mimi-charcoal mb-1">제목 (선택)</label>
            <input
              type="text"
              value={newGalleryTitle}
              onChange={(e) => setNewGalleryTitle(e.target.value)}
              placeholder="설명 또는 캡션"
              className="w-full px-4 py-2 rounded-lg border border-stone-200"
            />
          </div>
          <button onClick={handleAddGallery} className="btn-primary">
            갤러리에 추가
          </button>
        </div>
        {content.gallery.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-mimi-charcoal">등록된 항목 ({content.gallery.length}개)</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {content.gallery.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-stone-50 rounded-xl">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                    {item.type === "image" ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.url} alt={item.title ?? ""} className="w-full h-full object-cover" />
                    ) : item.url.startsWith("data:") ? (
                      <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title || "(제목 없음)"}</p>
                    <p className="text-xs text-mimi-slate truncate">{item.url.startsWith("data:") ? "로컬 파일" : item.url}</p>
                    <button
                      onClick={() => handleRemoveGallery(item.id)}
                      className="mt-2 text-xs text-red-600 hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-mimi-charcoal mb-2">추천 제품 링크</h2>
        <p className="text-sm text-mimi-slate mb-6">
          갤러리 아래에 노출됩니다. 제품 페이지나 쇼핑몰 링크를 추가하세요.
        </p>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-mimi-charcoal mb-1">제품명 *</label>
            <input
              type="text"
              value={newProductTitle}
              onChange={(e) => { setNewProductTitle(e.target.value); setProductError(""); }}
              placeholder="예: 강아지 샴푸"
              className="w-full px-4 py-2 rounded-lg border border-stone-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-mimi-charcoal mb-1">링크 URL *</label>
            <input
              type="text"
              value={newProductUrl}
              onChange={(e) => { setNewProductUrl(e.target.value); setProductError(""); }}
              placeholder="https://... 또는 coupang.com/..."
              className="w-full px-4 py-2 rounded-lg border border-stone-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-mimi-charcoal mb-1">이미지 (선택)</label>
            <div className="flex gap-2 mb-2">
              <input
                ref={productImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file?.type.startsWith("image/")) return;
                  try {
                    const dataUrl = await compressImage(file, PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_QUALITY);
                    setNewProductImageUrl(dataUrl);
                    setProductError("");
                  } catch {
                    setProductError("이미지 로드 실패");
                  }
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => productImageInputRef.current?.click()}
                className="px-3 py-2 rounded-lg border border-stone-300 hover:border-mimi-primary/50 text-sm"
              >
                📷 파일에서 선택
              </button>
              {newProductImageUrl && (
                <button
                  type="button"
                  onClick={() => setNewProductImageUrl("")}
                  className="text-xs text-red-600 hover:underline"
                >
                  이미지 제거
                </button>
              )}
            </div>
            <input
              type="url"
              value={newProductImageUrl}
              onChange={(e) => setNewProductImageUrl(e.target.value)}
              placeholder="또는 이미지 URL 입력"
              className="w-full px-4 py-2 rounded-lg border border-stone-200"
            />
            {newProductImageUrl && (
              <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={newProductImageUrl} alt="미리보기" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          {productError && <p className="text-sm text-red-600">{productError}</p>}
          <button onClick={handleAddProduct} className="btn-primary">
            제품 링크 추가
          </button>
        </div>
        {content.productLinks.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-mimi-charcoal">등록된 링크 ({content.productLinks.length}개)</h3>
            <ul className="space-y-2">
              {content.productLinks.map((item) => (
                <li key={item.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.imageUrl} alt="" className="w-[4.4rem] h-[4.4rem] rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-mimi-primary/10 flex items-center justify-center">🔗</div>
                    )}
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-mimi-slate truncate max-w-xs">{item.url}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(item.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-mimi-charcoal mb-2">육아 노하우</h2>
        <p className="text-sm text-mimi-slate mb-6">
          /tips 페이지에 노출됩니다. 제목, URL(slug), 본문을 수정할 수 있습니다.
        </p>
        <div className="space-y-4">
          {tips.map((tip) => (
            <div key={tip.id} className="p-4 bg-stone-50 rounded-xl space-y-3">
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={tip.title}
                  onChange={(e) => handleUpdateTip(tip.id, { title: e.target.value })}
                  placeholder="제목"
                  className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
                <input
                  type="text"
                  value={tip.slug}
                  onChange={(e) => handleUpdateTip(tip.id, { slug: e.target.value })}
                  placeholder="slug (URL)"
                  className="w-32 px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
                <button onClick={() => handleRemoveTip(tip.id)} className="text-sm text-red-600 hover:underline shrink-0">삭제</button>
              </div>
              <textarea
                value={tip.content}
                onChange={(e) => handleUpdateTip(tip.id, { content: e.target.value })}
                placeholder="본문 내용"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm resize-y"
              />
            </div>
          ))}
          <button onClick={handleAddTip} className="btn-primary text-sm py-2 px-4">
            + 노하우 추가
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-mimi-charcoal mb-2">공지 & 이벤트</h2>
        <p className="text-sm text-mimi-slate mb-6">
          /notice 페이지에 노출됩니다. 고정 공지는 상단에, 본문 내용은 화면에 표시됩니다.
        </p>
        <div className="space-y-4">
          {notices.map((notice) => (
            <div key={notice.id} className="p-4 bg-stone-50 rounded-xl space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={!!notice.pinned}
                    onChange={(e) => handleUpdateNotice(notice.id, { pinned: e.target.checked })}
                    className="rounded border-stone-300"
                  />
                  <span>고정</span>
                </label>
                <select
                  value={notice.type}
                  onChange={(e) => handleUpdateNotice(notice.id, { type: e.target.value as "공지" | "이벤트" })}
                  className="px-3 py-2 rounded-lg border border-stone-200 text-sm"
                >
                  <option value="공지">공지</option>
                  <option value="이벤트">이벤트</option>
                </select>
                <input
                  type="text"
                  value={notice.title}
                  onChange={(e) => handleUpdateNotice(notice.id, { title: e.target.value })}
                  placeholder="제목"
                  className="flex-1 min-w-[150px] px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
                <input
                  type="text"
                  value={notice.date}
                  onChange={(e) => handleUpdateNotice(notice.id, { date: e.target.value })}
                  placeholder="날짜 (예: 25.03.14)"
                  className="w-24 px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
                <input
                  type="text"
                  value={notice.url ?? ""}
                  onChange={(e) => handleUpdateNotice(notice.id, { url: e.target.value || undefined })}
                  placeholder="링크 URL (선택)"
                  className="w-48 px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
                <button onClick={() => handleRemoveNotice(notice.id)} className="text-sm text-red-600 hover:underline shrink-0">삭제</button>
              </div>
              <textarea
                value={notice.content ?? ""}
                onChange={(e) => handleUpdateNotice(notice.id, { content: e.target.value || undefined })}
                placeholder="본문 내용 (화면에 표시됨)"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm resize-y"
              />
            </div>
          ))}
          <button onClick={handleAddNotice} className="btn-primary text-sm py-2 px-4">
            + 공지/이벤트 추가
          </button>
        </div>
      </div>

      <p className="text-sm text-mimi-slate">
        <Link href="/" className="text-mimi-primary hover:underline">홈페이지에서 미리보기 →</Link>
        <span className="text-xs block mt-1 text-mimi-slate">(같은 브라우저에서 열어야 등록 내용이 보입니다)</span>
      </p>
    </div>
  );
}
