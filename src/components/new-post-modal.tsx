"use client";

import {
  startTransition,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createPost, type CreatePostState } from "@/app/feed/actions";
import { compressImage } from "@/lib/image-compression";
import { postTypes, typeLabel, typeTheme, type PostType } from "@/lib/post-types";
import { PlusIcon, XIcon } from "@/components/icons";

// Niño real de la sala del staff (el padre arma avatar/colores).
export interface PostKid {
  id: string;
  firstName: string;
  initials: string;
  avatarBackground: string;
  avatarForeground: string;
}

interface NewPostModalProps {
  open: boolean;
  onClose: () => void;
  kids: PostKid[];
  roomId: string | null;
  roomName: string;
  canPublishWholeRoom: boolean;
}

interface SelectedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  width: number | null;
  height: number | null;
}

const MAX_PHOTOS = 10;
const ACCEPTED_TYPES = "image/webp,image/jpeg,image/png";
const initialState: CreatePostState = {};

// Modal "Nueva publicación": réplica del mock references/pantallas/crear-publicacion.dc.html.
// Comprime las imágenes en el cliente y persiste con la Server Action createPost.
export default function NewPostModal({
  open,
  onClose,
  kids,
  roomId,
  roomName,
  canPublishWholeRoom,
}: NewPostModalProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createPost, initialState);

  const [selectedKids, setSelectedKids] = useState<Set<string>>(new Set());
  const [wholeRoom, setWholeRoom] = useState(false);
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const successHandled = useRef(false);
  // Última lista de fotos: permite revocar los object URLs al desmontar.
  const photosRef = useRef<SelectedPhoto[]>([]);

  const titleId = useId();
  const descriptionLabelId = useId();
  const photosLabelId = useId();

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Revoca los object URLs de las previews al desmontar el modal.
  useEffect(() => {
    return () => {
      for (const photo of photosRef.current) URL.revokeObjectURL(photo.previewUrl);
    };
  }, []);

  // Escape cierra el modal: el listener existe solo mientras está abierto.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // En éxito: limpia el formulario, cierra y refresca el feed (una sola vez por éxito).
  useEffect(() => {
    if (!state.success) {
      successHandled.current = false;
      return;
    }
    if (successHandled.current) return;
    successHandled.current = true;

    setSelectedKids(new Set());
    setWholeRoom(false);
    setSelectedType(null);
    setDescription("");
    setPhotos((prev) => {
      for (const photo of prev) URL.revokeObjectURL(photo.previewUrl);
      return [];
    });
    setSubmitted(false);
    onClose();
    router.refresh();
  }, [state.success, onClose, router]);

  // PARA: click en un niño agrega/quita su id y desactiva "Toda la sala".
  const toggleKid = (id: string) => {
    setWholeRoom(false);
    setSelectedKids((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // PARA: "Toda la sala" se activa y vacía la selección de niños.
  const selectWholeRoom = () => {
    setWholeRoom(true);
    setSelectedKids(new Set());
  };

  // TIPO: single-select con toggle (click en el activo lo deselecciona).
  const toggleType = (type: PostType) => {
    setSelectedType((prev) => (prev === type ? null : type));
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((item) => item.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  // Comprime cada archivo elegido y arma la preview (respeta el tope de 10).
  const handleFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const available = MAX_PHOTOS - photos.length;
    if (available <= 0) return;

    setIsCompressing(true);
    try {
      const next: SelectedPhoto[] = [];
      for (const file of files.slice(0, available)) {
        const compressed = await compressImage(file);
        const uploadFile = new File([compressed.blob], `${crypto.randomUUID()}.webp`, {
          type: compressed.mimeType,
        });
        next.push({
          id: crypto.randomUUID(),
          file: uploadFile,
          previewUrl: URL.createObjectURL(compressed.blob),
          width: compressed.width,
          height: compressed.height,
        });
      }
      setPhotos((prev) => [...prev, ...next]);
    } finally {
      setIsCompressing(false);
    }
  };

  if (!open) return null;

  const audienceError = !wholeRoom && selectedKids.size === 0;
  const typeError = selectedType === null;
  const descriptionError = description.trim() === "";
  const photosError = selectedType === "photo" && photos.length === 0;
  const isFormValid = !audienceError && !typeError && !descriptionError && !photosError;

  const showAudienceError = submitted && audienceError;
  const showTypeError = submitted && typeError;
  const showDescriptionError = submitted && descriptionError;
  const showPhotosError = submitted && photosError;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!isFormValid || isCompressing) return;

    const formData = new FormData();
    formData.set("type", selectedType ?? "");
    formData.set("body", description.trim());
    formData.set("roomId", wholeRoom && roomId ? roomId : "");
    for (const kidId of selectedKids) formData.append("childIds", kidId);
    for (const photo of photos) formData.append("photos", photo.file);
    formData.set(
      "photoMeta",
      JSON.stringify(photos.map((photo) => ({ width: photo.width, height: photo.height })))
    );

    startTransition(() => formAction(formData));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-6 py-10"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[580px] overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
      >
        <form onSubmit={handleSubmit}>
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
            <button type="button" onClick={onClose} className="text-[15px] font-bold text-ink-muted">
              Cancelar
            </button>
            <h2 id={titleId} className="font-display text-[18px] font-semibold text-ink">
              Nueva publicación
            </h2>
            <button
              type="submit"
              disabled={isPending || isCompressing}
              className="text-[15px] font-extrabold text-accent disabled:cursor-not-allowed disabled:text-ink-faint"
            >
              {isPending ? "Publicando…" : "Publicar"}
            </button>
          </div>

          {/* Contenido */}
          <div className="px-[26px] py-6">
            {state.error && (
              <p className="mb-[14px] rounded-[12px] bg-red-50 p-[12px_14px] text-[14px] font-semibold text-red-600">
                {state.error}
              </p>
            )}

            {/* PARA */}
            <div className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-ink-muted">PARA</div>
            <div role="group" aria-label="Para" className="mb-[22px] flex flex-wrap gap-[9px]">
              {kids.map((kid) => {
                const isActive = selectedKids.has(kid.id);
                return (
                  <button
                    key={kid.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => toggleKid(kid.id)}
                    className={`flex items-center gap-2 rounded-full border-[1.5px] py-[6px] pl-[6px] pr-[14px] text-[14px] font-bold ${
                      isActive ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-nav"
                    }`}
                  >
                    <span
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold"
                      style={{ backgroundColor: kid.avatarBackground, color: kid.avatarForeground }}
                    >
                      {kid.initials}
                    </span>
                    {kid.firstName}
                  </button>
                );
              })}
              {canPublishWholeRoom && (
                <button
                  type="button"
                  aria-pressed={wholeRoom}
                  onClick={selectWholeRoom}
                  className={`rounded-full border-[1.5px] px-4 py-[6px] text-[14px] font-bold ${
                    wholeRoom ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-nav"
                  }`}
                >
                  Toda la sala
                </button>
              )}
            </div>
            {showAudienceError && (
              <div className="-mt-[16px] mb-[18px] text-[13px] font-semibold text-[#E5484D]">
                Elegí al menos un destinatario
              </div>
            )}

            {/* TIPO */}
            <div className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-ink-muted">TIPO</div>
            <div role="group" aria-label="Tipo" className="mb-[22px] flex flex-wrap gap-[9px]">
              {postTypes.map((type) => {
                const isActive = type === selectedType;
                const theme = typeTheme[type];
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => toggleType(type)}
                    className="rounded-full px-4 py-2 text-[13.5px] font-extrabold"
                    style={
                      isActive
                        ? { backgroundColor: theme.filledBackground, color: "#fff" }
                        : { backgroundColor: theme.softBackground, color: theme.softText }
                    }
                  >
                    {typeLabel[type]}
                  </button>
                );
              })}
            </div>
            {showTypeError && (
              <div className="-mt-[16px] mb-[18px] text-[13px] font-semibold text-[#E5484D]">
                Elegí un tipo de publicación
              </div>
            )}

            {/* DESCRIPCIÓN */}
            <div id={descriptionLabelId} className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-ink-muted">
              DESCRIPCIÓN
            </div>
            <textarea
              aria-labelledby={descriptionLabelId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contá cómo le fue hoy…"
              className={`w-full min-h-[120px] resize-y rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] leading-[1.5] text-ink outline-none placeholder:text-[#B6A99B] ${
                showDescriptionError ? "border-[#E5484D]" : "border-field-border"
              }`}
            />
            {showDescriptionError && (
              <div className="mt-1.5 text-[13px] font-semibold text-[#E5484D]">La descripción es obligatoria</div>
            )}

            {/* FOTOS */}
            <div id={photosLabelId} className="mb-[10px] mt-[22px] text-[12px] font-extrabold tracking-[.7px] text-ink-muted">
              FOTOS <span className="font-bold text-ink-faint">{photos.length}/{MAX_PHOTOS}</span>
            </div>
            <div className="flex flex-wrap gap-3" aria-labelledby={photosLabelId}>
              {photos.map((photo) => (
                <div key={photo.id} className="relative h-24 w-24 overflow-hidden rounded-[14px] border border-line">
                  {/* Preview local (blob) de la imagen comprimida. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    aria-label="Quitar foto"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
                  >
                    <XIcon width={14} height={14} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-photo-line bg-photo-bg text-photo-ink disabled:opacity-60"
                >
                  <PlusIcon width={22} height={22} strokeWidth={2} className="text-[#C5503A]" />
                  <span className="text-xs">{isCompressing ? "Comprimiendo…" : "Agregar"}</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              onChange={handleFilesChange}
              className="hidden"
            />
            {showPhotosError && (
              <div className="mt-1.5 text-[13px] font-semibold text-[#E5484D]">
                El tipo Foto requiere al menos una imagen
              </div>
            )}

            {canPublishWholeRoom && (
              <p className="mt-3 text-[12.5px] text-ink-faint">
                Los anuncios de sala llegan a todas las familias de {roomName}.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
