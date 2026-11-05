import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, PointerEvent } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import DemoModal from './DemoModal';
import Avatar from './Avatar';

const SIZE = 384;
const LIMIT = 8 * 1024 * 1024;
type Picture = { source: string; image: HTMLImageElement; width: number; height: number };
type Position = { x: number; y: number };

export default function PhotoEditor({ photo, initials, name, onClose, onSave }: { photo?: string | null; initials: string; name: string; onClose: () => void; onSave: (photo: string | null) => Promise<void> }) {
  const [picture, setPicture] = useState<Picture | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const crop = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; position: Position } | null>(null);
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  const scaled = picture ? Math.max(SIZE / picture.width, SIZE / picture.height) * zoom : 1;
  const bounds = { x: picture ? (picture.width * scaled - SIZE) / 2 : 0, y: picture ? (picture.height * scaled - SIZE) / 2 : 0 };
  const clamp = (value: Position): Position => ({ x: Math.max(-bounds.x, Math.min(bounds.x, value.x)), y: Math.max(-bounds.y, Math.min(bounds.y, value.y)) });
  const offset = clamp(position);

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Выбери изображение JPG, PNG или WebP'); return; }
    if (file.size > LIMIT) { setError('Выбери фото размером до 8 МБ'); return; }
    const current = ++generation.current;
    setReading(true);
    try {
      const source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onerror = () => reject(new Error('Не удалось прочитать файл')); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file);
      });
      const image = new Image(); image.src = source;
      await image.decode().catch(() => { throw new Error('Не удалось открыть изображение. Выбери другой файл'); });
      if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('Изображение слишком большое. Выбери фото меньшего разрешения');
      if (generation.current !== current) return;
      setPicture({ source, image, width: image.naturalWidth, height: image.naturalHeight }); setZoom(1); setPosition({ x: 0, y: 0 });
    } catch (error) { if (generation.current === current) setError(error instanceof Error ? error.message : 'Не удалось открыть изображение'); }
    finally { if (generation.current === current) setReading(false); }
  };
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!picture || busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, position: offset };
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !crop.current) return;
    const ratio = SIZE / crop.current.getBoundingClientRect().width;
    setPosition(clamp({ x: drag.current.position.x + (event.clientX - drag.current.x) * ratio, y: drag.current.position.y + (event.clientY - drag.current.y) * ratio }));
  };
  const save = async (remove = false) => {
    if (busy || reading || (!remove && !picture)) return;
    setBusy(true); setError('');
    try {
      let result: string | null = null;
      if (!remove && picture) {
        const canvas = document.createElement('canvas'); canvas.width = SIZE; canvas.height = SIZE;
        const context = canvas.getContext('2d'); if (!context) throw new Error('Не удалось подготовить фото');
        context.fillStyle = '#ffffff'; context.fillRect(0, 0, SIZE, SIZE);
        context.drawImage(picture.image, (SIZE - picture.width * scaled) / 2 + offset.x, (SIZE - picture.height * scaled) / 2 + offset.y, picture.width * scaled, picture.height * scaled);
        result = canvas.toDataURL('image/jpeg', .85);
      }
      await onSave(result); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : 'Не удалось сохранить фото'); }
    finally { setBusy(false); }
  };

  return <DemoModal title="Фото профиля" onClose={() => { if (!busy) onClose(); }}><div className="photo-editor">
    <p className="photo-owner">{name}</p>
    <div className={`photo-crop ${picture ? 'has-picture' : ''}`} ref={crop} tabIndex={picture ? 0 : undefined} role={picture ? 'group' : undefined} aria-label="Кадрирование фото. Перетаскивай изображение или используй стрелки" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onKeyDown={event => { if (busy || !picture) return; const direction: Record<string, Position> = { ArrowLeft: { x: -10, y: 0 }, ArrowRight: { x: 10, y: 0 }, ArrowUp: { x: 0, y: -10 }, ArrowDown: { x: 0, y: 10 } }; if (direction[event.key]) { event.preventDefault(); setPosition(clamp({ x: offset.x + direction[event.key].x, y: offset.y + direction[event.key].y })); } }}>
      {picture ? <img src={picture.source} alt="Предпросмотр фото" draggable={false} style={{ width: `${picture.width * scaled / SIZE * 100}%`, height: `${picture.height * scaled / SIZE * 100}%`, left: `${50 + offset.x / SIZE * 100}%`, top: `${50 + offset.y / SIZE * 100}%` }} /> : <Avatar photo={photo} initials={initials} className="photo-current" />}
      {picture && <span className="photo-crop-mask" aria-hidden="true" />}
    </div>
    {picture && <><p className="photo-crop-help">Перетащи фото, чтобы выбрать область</p><label className="photo-zoom">Масштаб<input type="range" min="1" max="3" step="0.01" value={zoom} disabled={busy || reading} onChange={event => { setPosition(offset); setZoom(Number(event.target.value)); }} /></label></>}
    <input className="sr-only" type="file" tabIndex={-1} accept="image/jpeg,image/png,image/webp" ref={input} aria-label="Выбрать файл фотографии" onChange={choose} disabled={busy || reading} />
    <button className="button secondary full-width" disabled={busy || reading} onClick={() => input.current?.click()}><ImagePlus size={21} />{reading ? 'Загрузка…' : picture || photo ? 'Выбрать другое фото' : 'Выбрать фото'}</button>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="photo-editor-actions">{photo && <button className="button secondary" disabled={busy || reading} onClick={() => void save(true)}><Trash2 size={20} />Удалить фото</button>}<button className="button primary" disabled={!picture || busy || reading} onClick={() => void save()}>{busy ? 'Сохранение…' : 'Сохранить'}</button></div>
  </div></DemoModal>;
}
