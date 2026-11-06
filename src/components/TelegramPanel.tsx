import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Send, Unplug } from 'lucide-react';
import { requestBackend } from '../api';
import './telegram.css';

type Preferences = { deadlines: boolean; messages: boolean; events: boolean; participation: boolean };
type Connection = { available: boolean; connected: boolean; botUsername: string | null; account: string | null; preferences: Preferences };
type Link = { url: string; expiresAt: number };
const options: { key: keyof Preferences; label: string }[] = [
  { key: 'deadlines', label: 'Дедлайны и начало событий' },
  { key: 'messages', label: 'Сообщения учителей' },
  { key: 'events', label: 'Новые события по интересам' },
  { key: 'participation', label: 'Заявки и участие' },
];

export default function TelegramPanel({ compact = false }: { compact?: boolean }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [link, setLink] = useState<Link | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(false);
  const refresh = useCallback(async () => {
    try {
      const state = await requestBackend<Connection>('/telegram/status');
      if (alive.current) { setConnection(state); setError(''); if (state.connected) setLink(null); }
    } catch (error) { if (alive.current) setError(error instanceof Error ? error.message : 'Не удалось проверить подключение'); }
  }, []);
  useEffect(() => {
    alive.current = true;
    void refresh();
    const focus = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus);
    return () => { alive.current = false; window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); };
  }, [refresh]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, link ? 3000 : 30000);
    return () => clearInterval(timer);
  }, [link, refresh]);

  const connect = async () => {
    if (busy) return;
    // Open synchronously with the click so the browser permits the Telegram tab.
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    setBusy(true); setError('');
    try {
      const result = await requestBackend<Link>('/telegram/link', 'POST');
      if (alive.current) setLink(result);
      if (tab) tab.location.href = result.url;
    } catch (error) { tab?.close(); if (alive.current) setError(error instanceof Error ? error.message : 'Не удалось открыть Telegram'); }
    finally { if (alive.current) setBusy(false); }
  };
  const disconnect = async () => {
    setBusy(true); setError('');
    try { await requestBackend('/telegram/link', 'DELETE'); if (alive.current) setLink(null); await refresh(); }
    catch (error) { if (alive.current) setError(error instanceof Error ? error.message : 'Не удалось отключить Telegram'); }
    finally { if (alive.current) setBusy(false); }
  };
  const changePreference = async (key: keyof Preferences) => {
    if (!connection || busy) return;
    setBusy(true); setError('');
    try {
      const state = await requestBackend<Connection>('/telegram/preferences', 'PATCH', { ...connection.preferences, [key]: !connection.preferences[key] });
      if (alive.current) setConnection(state);
    } catch (error) { if (alive.current) setError(error instanceof Error ? error.message : 'Не удалось сохранить настройки'); }
    finally { if (alive.current) setBusy(false); }
  };
  const retry = async () => {
    setBusy(true);
    try { await refresh(); }
    finally { if (alive.current) setBusy(false); }
  };

  if (compact) return <div className="telegram-compact">
    {connection?.connected ? <button className="button secondary" onClick={() => setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen}><Send size={20}/>Telegram подключён</button> : link && link.expiresAt * 1000 > Date.now() ? <a className="button primary" href={link.url} target="_blank" rel="noopener noreferrer">Открыть Telegram<ExternalLink size={19}/></a> : <button className="button secondary" disabled={busy || !connection?.available} onClick={() => void connect()}><Send size={20}/>{busy ? 'Подключение…' : 'Подключить Telegram'}</button>}
    {(settingsOpen || error || (connection && !connection.available) || link) && <div className="telegram-compact-popover">
      {connection?.connected && <><div className="telegram-preferences">{options.map(option => <label key={option.key}><input type="checkbox" checked={connection.preferences[option.key]} disabled={busy} onChange={() => void changePreference(option.key)}/><span>{option.label}</span></label>)}</div><button className="button secondary" disabled={busy} onClick={() => void disconnect()}>Отключить Telegram</button></>}
      {link && !connection?.connected && <p>Нажми «Запустить» в боте.</p>}
      {(error || (connection && !connection.available)) && <><p role="status">{error || 'Бот временно недоступен'}</p><button className="button secondary" disabled={busy} onClick={() => void retry()}>Повторить</button></>}
    </div>}
  </div>;
  return <section className="telegram-panel" aria-label="Уведомления в Telegram">
    <div className="telegram-heading"><div className="telegram-title"><span className="telegram-mark"><Send size={25} /></span><div><h2>Telegram</h2><p>{connection?.connected ? `Подключён${connection.account ? ` · ${connection.account}` : ''}` : 'Сообщения, события и дедлайны'}</p></div></div>
      {connection?.connected ? <button className="button secondary" disabled={busy} onClick={() => void disconnect()}><Unplug size={19} />Отключить</button> : link && link.expiresAt * 1000 > Date.now() ? <a className="button primary" href={link.url} target="_blank" rel="noopener noreferrer">Открыть Telegram<ExternalLink size={19} /></a> : <button className="button primary" disabled={busy || !connection?.available} onClick={() => void connect()}><Send size={20} />{busy ? 'Подключение…' : 'Подключить Telegram'}</button>}
    </div>
    {link && !connection?.connected && <p className="telegram-pending" role="status">Нажми «Запустить» в боте. Подключение появится здесь автоматически.</p>}
    {connection?.connected && <div className="telegram-preferences">{options.map(option => <label key={option.key}><input type="checkbox" checked={connection.preferences[option.key]} disabled={busy} onChange={() => void changePreference(option.key)} /><span>{option.label}</span></label>)}</div>}
    {error ? <div className="telegram-retry"><p className="telegram-error" role="alert">{error}</p><button className="button secondary" disabled={busy} onClick={() => void retry()}>Повторить</button></div> : connection && !connection.available && <p className="telegram-pending">Бот временно недоступен. Попробуй позже.</p>}
  </section>;
}
