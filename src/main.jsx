import React from 'react';
import { createRoot } from 'react-dom/client';
import { Container } from '@videojs/react';
import { Video, VideoPlayer, usePlayer } from '@videojs/react/video';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient.js';
import './styles.css';

const HISTORY_KEY = 'afterframe-library-v2';
const ACTIVE_VIDEO_KEY = 'afterframe-active-video-v1';
const SETTINGS_KEY = 'afterframe-settings-v1';
const DB_NAME = 'afterframe-local-library';
const DB_STORE = 'video-handles';
const DB_FILE_STORE = 'video-files';
const FORMATS = '.mp4,.m4v,.webm,.ogv,.ogg,.mov,.mkv,.avi,.mpg,.mpeg,.3gp,.ts';
const SUBTITLE_LANGUAGES = [['English','en'],['Spanish','es'],['French','fr'],['German','de'],['Italian','it'],['Portuguese','pt'],['Arabic','ar'],['Swahili','sw'],['Hindi','hi'],['Urdu','ur'],['Bengali','bn'],['Chinese (Simplified)','zh'],['Japanese','ja'],['Korean','ko'],['Russian','ru'],['Ukrainian','uk'],['Dutch','nl'],['Polish','pl'],['Turkish','tr'],['Vietnamese','vi'],['Thai','th'],['Indonesian','id'],['Malay','ms'],['Filipino','fil'],['Persian','fa'],['Hebrew','he'],['Greek','el'],['Swedish','sv'],['Norwegian','no'],['Danish','da'],['Finnish','fi'],['Czech','cs'],['Romanian','ro'],['Hungarian','hu'],['Tamil','ta'],['Telugu','te']].map(([name, code]) => ({name, code}));

const iconPaths = {
  play: <path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none" />,
  logo: <><path d="M7.4 3.2C5 2 2.7 3.8 2.7 6.5v11c0 3.5 2.4 4.9 5.4 3.2l11-6.3c2.8-1.6 2.8-4.1 0-5.7L7.4 3.2Z" stroke="#b49a8d" strokeWidth="1.8"/><path d="M9 7.5c-1.3-.7-2.7.1-2.7 1.6v5.8c0 1.7 1.3 2.3 2.8 1.5l6.2-3.6c1.5-.9 1.5-2.2 0-3.1L9 7.5Z" stroke="#b49a8d" strokeWidth="1.8"/></>,
  pause: <path d="M7 5h4v14H7zm7 0h4v14h-4z" fill="currentColor" stroke="none" />,
  open: <><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M12 11v6m-3-3 3-3 3 3"/></>,
  library: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/><path d="M6 2v2m12-2v2"/></>,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-1.99 1.8l-.07.5a2 2 0 0 1-2.98 1.52l-.43-.25a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.43.25a2 2 0 0 1 0 3.46l-.43.25a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.43-.25a2 2 0 0 1 2.98 1.52l.07.5a2 2 0 0 0 1.99 1.8h.44a2 2 0 0 0 1.99-1.8l.07-.5a2 2 0 0 1 2.98-1.52l.43.25a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.43-.25a2 2 0 0 1 0-3.46l.43-.25a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.43.25a2 2 0 0 1-2.98-1.52l-.07-.5A2 2 0 0 0 12.22 2Z"/><circle cx="12" cy="12" r="3"/></> ,
  pip: <><rect x="3" y="5" width="16" height="13" rx="2"/><path d="M8 9h6m-6 3h3"/><rect x="14" y="14" width="7" height="6" rx="1.2" fill="currentColor" stroke="none"/></>,
  volume: <><path d="M4 10v4h3l4 3V7l-4 3H4Z"/><path d="M15 9a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11"/></>,
  muted: <><path d="M4 10v4h3l4 3V7l-4 3H4Z"/><path d="m16 9 5 6m0-6-5 6"/></>,
  full: <path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/>,
  back: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
  rewind10: <><path d="M4.2 8.2A8.3 8.3 0 1 1 3.8 13"/><path d="M3 4v5h5"/><text x="12.1" y="14.1" textAnchor="middle" fill="currentColor" stroke="none" fontSize="6.4" fontWeight="700" fontFamily="Arial,sans-serif">10</text></>,
  forward10: <><path d="M19.8 8.2A8.3 8.3 0 1 0 20.2 13"/><path d="M21 4v5h-5"/><text x="11.9" y="14.1" textAnchor="middle" fill="currentColor" stroke="none" fontSize="6.4" fontWeight="700" fontFamily="Arial,sans-serif">10</text></>,
  next: <><path d="M5 5v14l11-7z" fill="currentColor" stroke="none"/><path d="M19 5v14"/></>,
  prev: <><path d="M19 5v14L8 12z" fill="currentColor" stroke="none"/><path d="M5 5v14"/></>,
  captions: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h4m2 0h4M7 14h3m3 0h4"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  trash: <><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></>,
  bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>,
};

function Icon({ name, size = 19 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

function formatTime(value = 0) {
  if (!Number.isFinite(value)) return '0:00';
  const seconds = Math.max(0, Math.floor(value));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function writeHistory(items) { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 150))); }
function readSettings() {
  try { return { resume: true, rememberVolume: true, defaultSpeed: 1, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return { resume: true, rememberVolume: true, defaultSpeed: 1 }; }
}
function openHandleDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      if (!db.objectStoreNames.contains(DB_FILE_STORE)) db.createObjectStore(DB_FILE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function saveHandle(key, handle) {
  try { const db = await openHandleDB(); await new Promise((resolve, reject) => { const tx = db.transaction(DB_STORE, 'readwrite'); tx.objectStore(DB_STORE).put(handle, key); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); db.close(); } catch { /* Metadata and resume history still work without persistent handles. */ }
}
async function findHandle(key) {
  try { const db = await openHandleDB(); const value = await new Promise((resolve, reject) => { const req = db.transaction(DB_STORE).objectStore(DB_STORE).get(key); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); db.close(); return value; } catch { return null; }
}
async function saveLocalFile(key, file) {
  try {
    const db = await openHandleDB();
    await new Promise((resolve, reject) => { const tx = db.transaction(DB_FILE_STORE, 'readwrite'); tx.objectStore(DB_FILE_STORE).put(file, key); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });
    db.close(); return true;
  } catch { return false; }
}
async function findLocalFile(key) {
  try {
    const db = await openHandleDB();
    const file = await new Promise((resolve, reject) => { const req = db.transaction(DB_FILE_STORE).objectStore(DB_FILE_STORE).get(key); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
    db.close(); return file || null;
  } catch { return null; }
}
async function forgetLocalFile(key) {
  try {
    const db = await openHandleDB();
    await new Promise((resolve, reject) => { const tx = db.transaction(DB_FILE_STORE, 'readwrite'); tx.objectStore(DB_FILE_STORE).delete(key); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    db.close();
  } catch { /* Library metadata can still be removed if local storage is unavailable. */ }
}
function stableId(file) { return `${file.name}|${file.size}|${file.lastModified}`; }

async function cloudVideoKey(item) {
  // Never send file paths. Hash only file metadata so the same local item can
  // be matched across sessions without exposing its filesystem location.
  const source = `${item.name || ''}|${item.size || 0}|${item.lastModified || 0}`;
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  let hash = 2166136261;
  for (const character of source) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `fnv-${(hash >>> 0).toString(16)}`;
}

function App() {
  const [history, setHistory] = React.useState(readHistory);
  const [settings, setSettings] = React.useState(readSettings);
  const [playlist, setPlaylist] = React.useState([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [src, setSrc] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [resumeAt, setResumeAt] = React.useState(0);
  const [externalSubtitle, setExternalSubtitle] = React.useState(null);
  const [externalSubtitleLanguage, setExternalSubtitleLanguage] = React.useState('en');
  const [openPanel, setOpenPanel] = React.useState('');
  const [dragging, setDragging] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [playRequest, setPlayRequest] = React.useState(0);
  const [cloudUser, setCloudUser] = React.useState(null);
  const [cloudStatus, setCloudStatus] = React.useState(isSupabaseConfigured ? 'Sign in to sync playback progress.' : 'Add your Supabase Vite environment variables to enable cloud sync.');
  const [cloudBusy, setCloudBusy] = React.useState(false);
  const inputRef = React.useRef(null);
  const subtitleInputRef = React.useRef(null);
  const subtitleUrlRef = React.useRef('');
  const objectUrlRef = React.useRef('');
  const playlistRef = React.useRef([]);
  const cloudSyncBusyRef = React.useRef(false);

  React.useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); if (subtitleUrlRef.current) URL.revokeObjectURL(subtitleUrlRef.current); }, []);
  const notify = React.useCallback((message) => { setNotice(message); window.clearTimeout(notify.timer); notify.timer = window.setTimeout(() => setNotice(''), 3500); }, []);

  React.useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setCloudStatus('Could not restore your Supabase session.');
      setCloudUser(data?.session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCloudUser(session?.user || null);
      setCloudStatus(session?.user ? 'Signed in. Syncing your library…' : 'Sign in to sync playback progress.');
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const syncCloudHistory = React.useCallback(async (items, mergeRemote = false) => {
    if (!supabase || !cloudUser || cloudSyncBusyRef.current) return;
    cloudSyncBusyRef.current = true;
    setCloudBusy(true);
    setCloudStatus(mergeRemote ? 'Loading your saved progress…' : 'Syncing playback progress…');
    try {
      const eligible = (items || readHistory()).filter((item) => item.name && !item.path && (item.size || item.lastModified));
      const keyed = await Promise.all(eligible.map(async (item) => ({ item, video_key: await cloudVideoKey(item) })));
      let merged = keyed;
      if (mergeRemote) {
        const { data: remoteRows, error } = await supabase.from('video_progress').select('video_key,title,position_seconds,duration_seconds,is_saved,updated_at');
        if (error) throw error;
        const remoteByKey = new Map((remoteRows || []).map((row) => [row.video_key, row]));
        merged = keyed.map(({ item, video_key }) => {
          const remote = remoteByKey.get(video_key);
          if (!remote || Date.parse(remote.updated_at) <= Number(item.lastPlayed || item.lastOpened || 0)) return { item, video_key };
          const timestamp = Date.parse(remote.updated_at) || Date.now();
          if (localStorage.getItem(ACTIVE_VIDEO_KEY) === item.id && playlistRef.current.some((entry) => entry.id === item.id)) {
            setResumeAt(Math.max(0, Number(remote.position_seconds) || 0));
          }
          return { video_key, item: { ...item, position: remote.position_seconds, duration: remote.duration_seconds, saved: remote.is_saved, lastPlayed: timestamp } };
        });
        const mergedById = new Map(merged.map(({ item }) => [item.id, item]));
        const next = readHistory().map((item) => mergedById.get(item.id) || item);
        writeHistory(next);
        setHistory(next);
      }
      const payload = merged.map(({ item, video_key }) => ({
        user_id: cloudUser.id,
        video_key,
        title: item.name,
        position_seconds: Math.max(0, Number(item.position) || 0),
        duration_seconds: Math.max(0, Number(item.duration) || 0),
        is_saved: Boolean(item.saved),
        updated_at: new Date(Number(item.lastPlayed || item.lastOpened) || Date.now()).toISOString(),
      }));
      if (payload.length) {
        const { error } = await supabase.from('video_progress').upsert(payload, { onConflict: 'user_id,video_key' });
        if (error) throw error;
      }
      setCloudStatus(`Synced ${payload.length} ${payload.length === 1 ? 'video' : 'videos'} · ${cloudUser.email || 'account'}`);
    } catch (error) {
      console.error('Supabase playback sync failed:', error);
      setCloudStatus('Sync failed. Check the database migration and Supabase connection.');
    } finally {
      cloudSyncBusyRef.current = false;
      setCloudBusy(false);
    }
  }, [cloudUser]);

  React.useEffect(() => {
    if (!cloudUser) return undefined;
    const timer = window.setTimeout(() => syncCloudHistory(readHistory()), 1800);
    return () => window.clearTimeout(timer);
  }, [history, cloudUser, syncCloudHistory]);

  React.useEffect(() => {
    if (cloudUser) syncCloudHistory(readHistory(), true);
  // A sign-in performs the one-time cloud/local merge for this account.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudUser?.id]);

  const submitCloudAuth = async (email, password, createAccount) => {
    if (!supabase) return;
    setCloudBusy(true);
    setCloudStatus(createAccount ? 'Creating your account…' : 'Signing in…');
    try {
      const result = createAccount
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (createAccount && !result.data.session) setCloudStatus('Check your email to confirm the account, then sign in.');
      else setCloudStatus('Signed in. Syncing your library…');
    } catch (error) {
      setCloudStatus(error?.message || 'Could not connect to Supabase.');
    } finally { setCloudBusy(false); }
  };
  const signOutCloud = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    setCloudStatus(error ? 'Could not sign out.' : 'Signed out. Local playback remains available.');
  };

  const persistSettings = (next) => { setSettings(next); localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); };
  const activateFile = React.useCallback((file, handle = null, append = false, autoplay = false, restoring = false) => {
    if (!file || !file.type.startsWith('video/') && !/\.(mp4|m4v|webm|ogv|ogg|mov|mkv|avi|mpg|mpeg|3gp|ts)$/i.test(file.name)) { notify('Choose a video file to open.'); return; }
    const id = stableId(file);
    localStorage.setItem(ACTIVE_VIDEO_KEY, id);
    const prior = readHistory().find((item) => item.id === id);
    const item = { id, name: file.name, size: file.size, lastModified: file.lastModified, lastOpened: restoring ? (prior?.lastOpened || Date.now()) : Date.now(), lastPlayed: prior?.lastPlayed || 0, position: prior?.position || 0, duration: prior?.duration || 0, saved: prior?.saved || false, handleKey: handle ? id : prior?.handleKey || '' };
    if (handle) saveHandle(id, handle);
    // Keep a local IndexedDB copy as a fallback when the browser asks for the
    // file handle again after a restart. This never leaves the device.
    saveLocalFile(id, file);
    const nextHistory = [item, ...readHistory().filter((entry) => entry.id !== id)];
    writeHistory(nextHistory); setHistory(nextHistory);
    const entry = { id, name: file.name, file, handleKey: item.handleKey };
    const nextPlaylist = append ? [...playlistRef.current.filter((row) => row.id !== id), entry] : [entry];
    playlistRef.current = nextPlaylist;
    setPlaylist(nextPlaylist);
    const index = append ? nextPlaylist.length - 1 : 0;
    setActiveIndex(index);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file); objectUrlRef.current = url; setSrc(url); setTitle(file.name); setResumeAt(settings.resume ? item.position : 0); setOpenPanel('');
    if (autoplay) setPlayRequest((request) => request + 1);
    notify(`Opened ${file.name}`);
  }, [playlist, settings.resume, notify]);

  const activateDesktopVideo = (video, append = false, autoplay = false) => {
    const id = `desktop:${video.path}`;
    localStorage.setItem(ACTIVE_VIDEO_KEY, id);
    const prior = readHistory().find((item) => item.id === id);
    const { src: mediaSrc, ...metadata } = video;
    const item = { ...metadata, id, saved: prior?.saved || false, position: prior?.position || 0, duration: prior?.duration || 0, lastPlayed: prior?.lastPlayed || 0, handleKey: '' };
    const nextHistory = [item, ...readHistory().filter((entry) => entry.id !== id)];
    writeHistory(nextHistory); setHistory(nextHistory);
    const entry = { id, name: video.name, path: video.path, src: mediaSrc };
    const nextPlaylist = append ? [...playlistRef.current.filter((row) => row.id !== id), entry] : [entry];
    playlistRef.current = nextPlaylist; setPlaylist(nextPlaylist);
    const index = append ? nextPlaylist.length - 1 : 0;
    setActiveIndex(index); setSrc(mediaSrc); setTitle(video.name); setResumeAt(settings.resume ? item.position : 0); setOpenPanel('');
    if (autoplay) setPlayRequest((request) => request + 1);
  };

  React.useEffect(() => {
    let cancelled = false;
    const restoreLastVideo = async () => {
      const desktop = Boolean(window.afterframeDesktop?.isDesktop);
      let items = readHistory();
      if (desktop) {
        try {
          const desktopItems = await window.afterframeDesktop.getLibrary();
          if (cancelled) return;
          const storedByPath = new Map(items.filter((item) => item.path).map((item) => [item.path, item]));
          const restored = desktopItems.map((item) => ({ ...item, id: `desktop:${item.path}`, ...(storedByPath.get(item.path) || {}), path: item.path }));
          items = [...restored, ...items.filter((item) => !item.path)];
          writeHistory(items);
          setHistory(items);
        } catch { /* Keep the local library available when desktop storage is offline. */ }
      }
      const rememberedId = localStorage.getItem(ACTIVE_VIDEO_KEY);
      if (rememberedId === '') return;
      const mostRecentResumable = [...items].filter((item) => Number(item.position) > 0).sort((a, b) => Number(b.lastPlayed || b.lastOpened || 0) - Number(a.lastPlayed || a.lastOpened || 0))[0];
      const item = items.find((entry) => entry.id === rememberedId) || (rememberedId === null ? mostRecentResumable : null);
      if (!item || cancelled) return;
      if (desktop && item.path) {
        try {
          const video = await window.afterframeDesktop.restoreVideo(item.path);
          if (!cancelled) activateDesktopVideo(video, false, true);
        } catch { /* Keep the item in the library; the user can reopen it manually. */ }
        return;
      }
      let handle = item.handleKey ? await findHandle(item.handleKey) : null;
      if (handle) {
        try {
          if (await handle.queryPermission({ mode: 'read' }) !== 'granted') handle = null;
        } catch { handle = null; }
      }
      let file = null;
      if (handle) {
        try { file = await handle.getFile(); } catch { handle = null; }
      }
      if (!file) file = await findLocalFile(item.id);
      if (!cancelled && file) activateFile(file, handle, false, true, true);
    };
    restoreLastVideo();
    return () => { cancelled = true; };
  // Restore once on launch; the callback closes over the initial resume preference (enabled by default).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPicker = async () => {
    if (window.afterframeDesktop?.isDesktop) {
      try { const videos = await window.afterframeDesktop.openVideos(); videos.forEach((video, index) => activateDesktopVideo(video, index > 0)); }
      catch (error) { notify(error?.message || 'Could not open the selected video.'); }
      return;
    }
    if (window.showOpenFilePicker) {
      try {
        const handles = await window.showOpenFilePicker({ multiple: true, types: [{ description: 'Video files', accept: { 'video/mp4': ['.mp4', '.m4v'], 'video/webm': ['.webm'], 'video/ogg': ['.ogv', '.ogg'], 'video/quicktime': ['.mov'], 'video/x-matroska': ['.mkv'], 'video/x-msvideo': ['.avi'], 'video/mpeg': ['.mpg', '.mpeg'], 'video/3gpp': ['.3gp'], 'video/mp2t': ['.ts'] } }] });
        const files = await Promise.all(handles.map(async (handle) => ({ handle, file: await handle.getFile() })));
        files.forEach(({ file, handle }, index) => activateFile(file, handle, index > 0));
      } catch (error) { if (error?.name !== 'AbortError') { inputRef.current?.click(); } }
    } else inputRef.current?.click();
  };
  const onSubtitleFile = async (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['vtt', 'srt'].includes(ext)) { notify('Choose a .vtt or .srt subtitle file.'); return; }
    let blob = file;
    if (ext === 'srt') {
      try {
        const srt = (await file.text()).replace(/^\uFEFF/, '').replace(/\r/g, '');
        const vtt = srt.replace(/^\d+\s*\n(?=\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->)/gm, '').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
        blob = new Blob([`WEBVTT\n\n${vtt}`], {type:'text/vtt'});
      } catch { notify('Could not read that subtitle file.'); return; }
    }
    if (subtitleUrlRef.current) URL.revokeObjectURL(subtitleUrlRef.current);
    const url = URL.createObjectURL(blob); subtitleUrlRef.current = url;
    const baseName = file.name.replace(/\.(vtt|srt)$/i, '');
    const match = baseName.match(/(?:^|[._ -])(en|es|fr|de|it|pt|ar|sw|hi|ur|bn|zh|ja|ko|ru|uk|nl|pl|tr|vi|th|id|ms|fa|he|el|sv|no|da|fi|cs|ro|hu|ta|te)(?:$|[._ -])/i);
    if (match) setExternalSubtitleLanguage(match[1].toLowerCase());
    setExternalSubtitle({src:url, label:baseName || 'Subtitles'});
    notify(`Added subtitles: ${baseName}`);
  };
  const onDrop = (event) => { event.preventDefault(); setDragging(false); [...event.dataTransfer.files].forEach((file, index) => activateFile(file, null, index > 0)); };

  const openLibraryItem = async (item) => {
    const inPlaylist = playlistRef.current.findIndex((entry) => entry.id === item.id);
    if (inPlaylist >= 0) { activatePlaylistIndex(inPlaylist, true); return; }
    if (item.path && window.afterframeDesktop?.isDesktop) {
      try { activateDesktopVideo(await window.afterframeDesktop.restoreVideo(item.path), false, true); }
      catch (error) { notify(error?.message || 'Could not reopen this video.'); }
      return;
    }
    let handle = item.handleKey ? await findHandle(item.handleKey) : null;
    if (handle) {
      try {
        let permission = await handle.queryPermission({ mode: 'read' });
        if (permission !== 'granted') permission = await handle.requestPermission({ mode: 'read' });
        if (permission === 'granted') { activateFile(await handle.getFile(), handle, false, true); return; }
      } catch { /* Continue to the explicit reselect fallback below. */ }
    }
    const storedFile = await findLocalFile(item.id);
    if (storedFile) { activateFile(storedFile, null, false, true); return; }
    if (inputRef.current) { inputRef.current.dataset.reopenId = item.id; inputRef.current.click(); setOpenPanel(''); }
  };
  const onReopenFiles = (event) => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    const targetId = event.target.dataset.reopenId;
    event.target.dataset.reopenId = '';
    if (targetId) {
      const target = history.find((item) => item.id === targetId);
      const match = files.find((file) => file.name === target?.name);
      if (match) activateFile(match, null, false, true); else notify('That file name did not match the selected library item.');
    } else files.forEach((file, index) => activateFile(file, null, index > 0));
    event.target.value = '';
  };
  const removeHistoryItem = async (id) => {
    const removed = history.find((item) => item.id === id);
    const next = history.filter((item) => item.id !== id);
    setHistory(next); writeHistory(next);
    if (localStorage.getItem(ACTIVE_VIDEO_KEY) === id) {
      localStorage.setItem(ACTIVE_VIDEO_KEY, '');
      setSrc(''); setTitle(''); setResumeAt(0); setPlaylist([]); playlistRef.current = []; setActiveIndex(-1);
      if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = ''; }
    }
    if (removed?.path && window.afterframeDesktop?.isDesktop) window.afterframeDesktop.forgetVideo(removed.path).catch(() => {});
    if (!removed?.path) forgetLocalFile(id);
    if (supabase && cloudUser && removed?.name && (removed.size || removed.lastModified)) {
      const videoKey = await cloudVideoKey(removed);
      await supabase.from('video_progress').delete().eq('user_id', cloudUser.id).eq('video_key', videoKey);
    }
  };
  const toggleSaved = (id) => { const next = history.map((item) => item.id === id ? { ...item, saved: !item.saved } : item); setHistory(next); writeHistory(next); };
  const activatePlaylistIndex = (index, autoplay = false) => {
    const entry = playlistRef.current[index];
    if (!entry) return;
    const historyItem = readHistory().find((item) => item.id === entry.id);
    localStorage.setItem(ACTIVE_VIDEO_KEY, entry.id);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = entry.file ? URL.createObjectURL(entry.file) : entry.src;
    if (entry.file) objectUrlRef.current = url;
    setSrc(url); setTitle(entry.name); setActiveIndex(index); setResumeAt(settings.resume ? historyItem?.position || 0 : 0);
    if (autoplay) setPlayRequest((request) => request + 1);
    const nextHistory = readHistory().map((item) => item.id === entry.id ? { ...item, lastOpened: Date.now() } : item);
    writeHistory(nextHistory); setHistory(nextHistory); setOpenPanel('');
  };
  const handleProgress = React.useCallback((entryId, position, duration) => {
    if (!entryId || !Number.isFinite(position)) return;
    const next = readHistory().map((item) => item.id === entryId ? { ...item, position, duration: duration || item.duration, lastPlayed: Date.now() } : item);
    writeHistory(next); setHistory(next);
  }, []);
  const handlePlaybackEnded = React.useCallback((entryId) => {
    if (localStorage.getItem(ACTIVE_VIDEO_KEY) === entryId) localStorage.setItem(ACTIVE_VIDEO_KEY, '');
    setSrc(''); setTitle(''); setResumeAt(0); setPlaylist([]); playlistRef.current = []; setActiveIndex(-1);
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = ''; }
  }, []);

  return <main className="app-window" onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={onDrop}>
    <VideoPlayer>
      <Container className="player-stage">
        <Video src={src || undefined} playsInline preload="metadata" aria-label={title || 'AFTERFRAME video player'}>{externalSubtitle && <track key={`${externalSubtitle.src}-${externalSubtitleLanguage}`} kind="subtitles" src={externalSubtitle.src} srcLang={externalSubtitleLanguage} label={`${externalSubtitle.label} · ${SUBTITLE_LANGUAGES.find((language) => language.code === externalSubtitleLanguage)?.name || externalSubtitleLanguage}`} />}</Video>
        <AppChrome title={title} src={src} hasVideo={Boolean(src)} playRequest={playRequest} onOpen={openPicker} onPanel={setOpenPanel} openPanel={openPanel} history={history} onOpenLibraryItem={openLibraryItem} onRemoveHistory={removeHistoryItem} onToggleSaved={toggleSaved} settings={settings} onSettings={persistSettings} onClose={() => setOpenPanel('')} onProgress={handleProgress} onPlaybackEnded={handlePlaybackEnded} activeId={playlist[activeIndex]?.id} onPrevious={() => activatePlaylistIndex(activeIndex - 1)} onNext={() => activatePlaylistIndex(activeIndex + 1)} playlist={playlist} activeIndex={activeIndex} resumeAt={resumeAt} onResumeApplied={() => setResumeAt(0)} notify={notify} externalSubtitle={externalSubtitle} externalSubtitleLanguage={externalSubtitleLanguage} onSubtitleLanguageChange={setExternalSubtitleLanguage} onLoadSubtitle={() => subtitleInputRef.current?.click()} cloudUser={cloudUser} cloudStatus={cloudStatus} cloudBusy={cloudBusy} onCloudAuth={submitCloudAuth} onCloudSignOut={signOutCloud} onCloudSync={() => syncCloudHistory(readHistory(), true)} />
      </Container>
    </VideoPlayer>
    <input ref={inputRef} className="file-input" type="file" accept={`video/*,${FORMATS}`} multiple onChange={onReopenFiles} aria-label="Choose video files" />
    <input ref={subtitleInputRef} className="file-input" type="file" accept=".vtt,.srt,text/vtt,application/x-subrip" onChange={onSubtitleFile} aria-label="Choose subtitle file" />
    {dragging && <div className="drop-overlay" aria-live="polite"><div><Icon name="open" size={30}/><strong>Drop videos to open</strong><span>Files stay on this device</span></div></div>}
    {notice && <div className="toast" role="status">{notice}</div>}
  </main>;
}

function AppChrome(props) {
  const paused = usePlayer((s) => s.paused);
  const ended = usePlayer((s) => s.ended);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const fullscreen = usePlayer((s) => s.isFullscreen);
  const playbackRate = usePlayer((s) => s.playbackRate);
  const playbackRates = usePlayer((s) => s.playbackRates);
  const currentSrc = usePlayer((s) => s.currentSrc);
  const textTrackList = usePlayer((s) => s.textTrackList);
  const subtitlesShowing = usePlayer((s) => s.subtitlesShowing);
  const audioTrackList = usePlayer((s) => s.audioTrackList);
  const play = usePlayer((s) => s.play);
  const pause = usePlayer((s) => s.pause);
  const seek = usePlayer((s) => s.seek);
  const setVolume = usePlayer((s) => s.setVolume);
  const setMuted = usePlayer((s) => s.setMuted);
  const requestFullscreen = usePlayer((s) => s.requestFullscreen);
  const exitFullscreen = usePlayer((s) => s.exitFullscreen);
  const setPlaybackRate = usePlayer((s) => s.setPlaybackRate);
  const selectSubtitlesTrack = usePlayer((s) => s.selectSubtitlesTrack);
  const selectAudioTrack = usePlayer((s) => s.selectAudioTrack);
  const [pictureInPicture, setPictureInPicture] = React.useState(false);
  const [pipFallback, setPipFallback] = React.useState(false);
  const playerShellRef = React.useRef(null);
  const [controlsVisible, setControlsVisible] = React.useState(true);
  const [scrubbing, setScrubbing] = React.useState(null);
  const [seekFeedback, setSeekFeedback] = React.useState(null);
  const [subtitleMenuOpen, setSubtitleMenuOpen] = React.useState(false);
  const timerRef = React.useRef(null);
  const feedbackTimerRef = React.useRef(null);
  const appliedResumeRef = React.useRef('');
  const handledEndedRef = React.useRef('');
  const appliedPlayRequestRef = React.useRef(0);
  const lastSaveRef = React.useRef(0);
  const playbackSnapshotRef = React.useRef(null);
  const appliedVolumeRef = React.useRef('');
  const rates = playbackRates?.length ? playbackRates : [0.5, 0.75, 1, 1.25, 1.5, 2];
  const active = props.playlist[props.activeIndex];
  playbackSnapshotRef.current = active?.id && props.hasVideo && currentSrc === props.src ? { id: active.id, position: ended ? 0 : currentTime, duration } : null;

  React.useEffect(() => {
    if (!ended || !active?.id || !props.hasVideo || currentSrc !== props.src) {
      if (!ended) handledEndedRef.current = '';
      return;
    }
    const endedKey = `${active.id}:${props.src}`;
    if (handledEndedRef.current === endedKey) return;
    handledEndedRef.current = endedKey;
    props.onPlaybackEnded(active.id);
  }, [ended, active?.id, props.hasVideo, currentSrc, props.src, props.onPlaybackEnded]);

  const reveal = React.useCallback(() => {
    setControlsVisible(true); clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const focusIsInPlayer = playerShellRef.current?.contains(document.activeElement);
      if (!paused && !props.openPanel && !subtitleMenuOpen && !focusIsInPlayer) setControlsVisible(false);
    }, 2600);
  }, [paused, props.openPanel, subtitleMenuOpen]);
  React.useEffect(() => { if (paused) { clearTimeout(timerRef.current); setControlsVisible(true); } else reveal(); }, [paused, reveal]);
  React.useEffect(() => () => clearTimeout(timerRef.current), []);
  React.useEffect(() => () => clearTimeout(feedbackTimerRef.current), []);
  React.useEffect(() => {
    if (!props.externalSubtitle) return;
    const externalTrack = (textTrackList || []).find((track) => ['captions', 'subtitles'].includes(track.kind) && track.label?.startsWith(props.externalSubtitle.label));
    if (externalTrack && externalTrack.mode !== 'showing') selectSubtitlesTrack(externalTrack.id);
  }, [props.externalSubtitle, textTrackList, selectSubtitlesTrack]);
  React.useEffect(() => {
    const updatePictureInPicture = () => setPictureInPicture(Boolean(document.pictureInPictureElement));
    document.addEventListener('enterpictureinpicture', updatePictureInPicture, true);
    document.addEventListener('leavepictureinpicture', updatePictureInPicture, true);
    return () => {
      document.removeEventListener('enterpictureinpicture', updatePictureInPicture, true);
      document.removeEventListener('leavepictureinpicture', updatePictureInPicture, true);
    };
  }, []);
  React.useEffect(() => {
    const stage = playerShellRef.current?.closest('.player-stage');
    stage?.classList.toggle('pip-mini-mode', pipFallback);
    return () => stage?.classList.remove('pip-mini-mode');
  }, [pipFallback]);
  React.useEffect(() => {
    const saveLatestPosition = () => {
      const snapshot = playbackSnapshotRef.current;
      if (snapshot) props.onProgress(snapshot.id, snapshot.position, snapshot.duration);
    };
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') saveLatestPosition(); };
    window.addEventListener('pagehide', saveLatestPosition);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      saveLatestPosition();
      window.removeEventListener('pagehide', saveLatestPosition);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [props.onProgress]);
  React.useEffect(() => {
    if (!props.playRequest || appliedPlayRequestRef.current === props.playRequest || currentSrc !== props.src) return;
    appliedPlayRequestRef.current = props.playRequest;
    play()?.catch?.(() => props.notify('Tap play to start this video.'));
  }, [props.playRequest, props.src, currentSrc, play, props.notify]);
  React.useEffect(() => {
    const resumeKey = `${active?.id}:${props.resumeAt}`;
    if (!active?.id || !props.resumeAt || !duration || currentSrc !== props.src || appliedResumeRef.current === resumeKey) return;
    seek(Math.min(props.resumeAt, Math.max(0, duration - 1)))?.catch?.(() => {});
    appliedResumeRef.current = resumeKey; props.onResumeApplied();
  }, [active?.id, props.resumeAt, duration, currentSrc, props.src, seek, props.onResumeApplied]);
  React.useEffect(() => {
    if (!active?.id || !props.hasVideo || currentSrc !== props.src) return;
    const wait = paused ? 0 : Math.max(0, 1000 - (Date.now() - lastSaveRef.current));
    const timeout = setTimeout(() => { lastSaveRef.current = Date.now(); props.onProgress(active.id, ended ? 0 : currentTime, duration); }, wait);
    return () => clearTimeout(timeout);
  }, [active?.id, currentTime, duration, props.hasVideo, props.onProgress, paused, ended, currentSrc, props.src]);
  React.useEffect(() => {
    if (!props.hasVideo || currentSrc !== props.src) return;
    setPlaybackRate(props.settings.defaultSpeed);
  }, [props.activeId, props.src, props.hasVideo, props.settings.defaultSpeed, currentSrc, setPlaybackRate]);
  React.useEffect(() => {
    if (!props.hasVideo || !props.settings.rememberVolume || currentSrc !== props.src || appliedVolumeRef.current === props.src) return;
    const storedVolume = localStorage.getItem('afterframe-volume');
    const remembered = Number(storedVolume);
    if (storedVolume !== null && Number.isFinite(remembered)) setVolume(Math.min(1, Math.max(0, remembered)));
    appliedVolumeRef.current = props.src;
  }, [props.src, props.hasVideo, props.settings.rememberVolume, currentSrc, setVolume]);

  React.useEffect(() => {
    const onKey = (event) => {
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(event.target.tagName))) return;
      if (event.code === 'Space') { event.preventDefault(); paused ? play()?.catch?.(() => {}) : pause(); reveal(); }
      else if (event.key === 'ArrowLeft') { seek(Math.max(0, currentTime - (event.shiftKey ? 30 : 5)))?.catch?.(() => {}); reveal(); }
      else if (event.key === 'ArrowRight') { seek(Math.min(duration || currentTime + 5, currentTime + (event.shiftKey ? 30 : 5)))?.catch?.(() => {}); reveal(); }
      else if (event.key.toLowerCase() === 'm') { setMuted(!muted); reveal(); }
      else if (event.key.toLowerCase() === 'f') { (fullscreen ? exitFullscreen : requestFullscreen)?.()?.catch?.(() => {}); reveal(); }
      else if (event.key === '[' || event.key === ']') { const i = rates.indexOf(playbackRate); setPlaybackRate(rates[Math.max(0, Math.min(rates.length - 1, i + (event.key === ']' ? 1 : -1)))]); reveal(); }
      else if (event.key === 'n') { props.onNext(); reveal(); }
      else if (event.key === 'p') { props.onPrevious(); reveal(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused, play, pause, currentTime, duration, seek, muted, setMuted, fullscreen, exitFullscreen, requestFullscreen, rates, playbackRate, setPlaybackRate, props, reveal]);

  React.useEffect(() => {
    const closeMenus = (event) => {
      if (event.key !== 'Escape') return;
      if (!props.openPanel && !subtitleMenuOpen) return;
      if (event.target instanceof HTMLElement && event.target.closest('.language-picker')) return;
      event.stopPropagation();
      setSubtitleMenuOpen(false);
      props.onClose();
      reveal();
    };
    window.addEventListener('keydown', closeMenus, true);
    return () => window.removeEventListener('keydown', closeMenus, true);
  }, [props.openPanel, props.onClose, subtitleMenuOpen, reveal]);

  const activePanel = props.openPanel;
  const seekBy = (delta, direction = delta < 0 ? 'left' : 'right') => {
    seek(Math.max(0, Math.min(duration || currentTime + delta, currentTime + delta)))?.catch?.(() => {});
    setSeekFeedback({ direction }); clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setSeekFeedback(null), 850);
  };
  const togglePlay = () => paused ? play()?.catch?.(() => {}) : pause();
  const toggleFull = () => {
    props.onClose();
    if (fullscreen) exitFullscreen()?.catch?.(() => {});
    else requestFullscreen()?.catch?.(() => {});
  };
  const togglePictureInPicture = async () => {
    const video = playerShellRef.current?.closest('.player-stage')?.querySelector('video') || playerShellRef.current?.querySelector('video');
    if (!props.hasVideo || !video) { props.notify('Open a video before using picture-in-picture.'); return; }
    try {
      if (document.pictureInPictureElement === video) { await document.exitPictureInPicture(); setPictureInPicture(false); return; }
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      if (typeof video.requestPictureInPicture === 'function' && document.pictureInPictureEnabled !== false) {
        await video.requestPictureInPicture();
        setPictureInPicture(true);
        setPipFallback(false);
      } else if (video.webkitSupportsPresentationMode && video.webkitSetPresentationMode) {
        video.webkitSetPresentationMode(video.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
        setPictureInPicture(video.webkitPresentationMode === 'picture-in-picture');
      } else {
        setPipFallback((active) => !active);
        setPictureInPicture((active) => !active);
      }
    } catch {
      setPipFallback((active) => !active);
      setPictureInPicture((active) => !active);
    }
  };
  const changeVolume = (value) => { setVolume(value); if (props.settings.rememberVolume) localStorage.setItem('afterframe-volume', String(value)); if (value > 0 && muted) setMuted(false); };
  const subtitleTracks = (textTrackList || []).filter((track) => ['captions', 'subtitles'].includes(track.kind));
  const chooseSubtitleTrack = (track) => { selectSubtitlesTrack(track.id); setSubtitleMenuOpen(false); };


  return <div ref={playerShellRef} className={`chrome-layer${controlsVisible || paused || activePanel || subtitleMenuOpen ? ' chrome-visible' : ''}${fullscreen ? ' player-fullscreen' : ''}${pipFallback ? ' pip-fallback' : ''}`} onPointerMove={reveal} onPointerDown={reveal} onFocusCapture={reveal} onClick={(event) => { if (event.target.closest('button, input, .side-panel, .subtitle-menu, .empty-player')) return; if (props.hasVideo) { const bounds = event.currentTarget.getBoundingClientRect(); const relativeX = (event.clientX - bounds.left) / bounds.width; if (relativeX < 0.28) seekBy(-10, 'left'); else if (relativeX > 0.72) seekBy(10, 'right'); else togglePlay(); } else props.onOpen(); reveal(); }}>
    <div className="top-gradient" aria-hidden="true"/>
    <header className="app-toolbar" aria-label="AFTERFRAME toolbar">
      <div className="app-brand" aria-label="AFTERFRAME"><span className="brand-mark"><Icon name="logo" size={27}/></span><span>AFTERFRAME</span></div>
      <nav className="primary-actions" aria-label="Library and app actions">
        <button className="toolbar-button primary-open" type="button" onClick={props.onOpen} aria-label="Open video"><Icon name="open"/><span>Open video</span></button>
        <button className={`toolbar-button${activePanel === 'library' ? ' selected' : ''}`} type="button" onClick={() => props.onPanel(activePanel === 'library' ? '' : 'library')} aria-expanded={activePanel === 'library'} aria-label="Video library"><Icon name="library"/><span>Video library</span></button>
        <button className={`toolbar-button${activePanel === 'settings' ? ' selected' : ''}`} type="button" onClick={() => props.onPanel(activePanel === 'settings' ? '' : 'settings')} aria-expanded={activePanel === 'settings'} aria-label="Settings"><Icon name="settings"/><span>Settings</span></button>
      </nav>
    </header>

    {!props.hasVideo && <div className="empty-player" onClick={props.onOpen} role="button" tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') props.onOpen(); }}><div className="empty-play"><Icon name="logo" size={38}/></div><strong>Drop in and play</strong><span>Open a video or drag one onto this window</span></div>}
    {props.hasVideo && paused && <button className="center-play" type="button" onClick={togglePlay} aria-label="Play video"><Icon name="logo" size={44}/></button>}
    {props.hasVideo && seekFeedback && <div className={`seek-feedback feedback-${seekFeedback.direction}`} aria-live="polite"><Icon name={seekFeedback.direction === 'left' ? 'rewind10' : 'forward10'} size={24}/><span>10 seconds</span></div>}

    {activePanel === 'library' && <LibraryPanel items={props.history} activeId={props.activeId} onOpen={props.onOpenLibraryItem} onRemove={props.onRemoveHistory} onToggleSaved={props.onToggleSaved} onClose={props.onClose}/>}
    {activePanel === 'settings' && <SettingsPanel settings={props.settings} onChange={props.onSettings} rates={rates} playbackRate={playbackRate} setPlaybackRate={setPlaybackRate} tracks={textTrackList} subtitlesShowing={subtitlesShowing} selectSubtitlesTrack={selectSubtitlesTrack} externalSubtitle={props.externalSubtitle} externalSubtitleLanguage={props.externalSubtitleLanguage} onSubtitleLanguageChange={props.onSubtitleLanguageChange} onLoadSubtitle={props.onLoadSubtitle} audioTracks={audioTrackList} selectAudioTrack={selectAudioTrack} onClose={props.onClose} cloudUser={props.cloudUser} cloudStatus={props.cloudStatus} cloudBusy={props.cloudBusy} onCloudAuth={props.onCloudAuth} onCloudSignOut={props.onCloudSignOut} onCloudSync={props.onCloudSync}/>}

    {props.hasVideo && <>
      <div className="timeline-controls">
        <span>{formatTime(scrubbing ?? currentTime)}</span>
        <div className="timeline-wrap"><div className="timeline-track"><i className="timeline-fill" style={{ width: `${duration ? (scrubbing ?? currentTime) / duration * 100 : 0}%` }}/><b className="timeline-knob" style={{ left: `${duration ? (scrubbing ?? currentTime) / duration * 100 : 0}%` }}/></div><input aria-label="Seek video" aria-valuetext={`${formatTime(scrubbing ?? currentTime)} of ${formatTime(duration)}`} type="range" min="0" max={duration || 0} step="0.1" value={scrubbing ?? currentTime} onChange={(event) => { const next = Number(event.target.value); setScrubbing(next); seek(next)?.catch?.(() => {}); }} onPointerUp={() => setScrubbing(null)} onBlur={() => setScrubbing(null)}/></div>
        <span>{`−${formatTime(Math.max(0, duration - currentTime))}`}</span>
      </div>
      <div className="bottom-controls" role="group" aria-label="Video controls">
        <div className="controls-left">
          <button className="control-button primary-transport" type="button" onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'} title={paused ? 'Play (Space)' : 'Pause (Space)'}><Icon name={paused ? 'play' : 'pause'} size={19}/></button>
          <button className="control-button skip-button" type="button" onClick={() => seekBy(-10)} aria-label="Back 10 seconds" title="Back 10 seconds"><Icon name="rewind10" size={21}/></button>
          <button className="control-button skip-button" type="button" onClick={() => seekBy(10)} aria-label="Forward 10 seconds" title="Forward 10 seconds"><Icon name="forward10" size={21}/></button>
          <button className="control-button" type="button" onClick={() => props.onPrevious()} aria-label="Previous video" title="Previous video"><Icon name="prev" size={17}/></button>
          <button className="control-button" type="button" onClick={() => props.onNext()} aria-label="Next video" title="Next video"><Icon name="next" size={17}/></button>
          <div className="volume-control"><button className="control-button" type="button" onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute' : 'Mute'} title="Mute (M)"><Icon name={muted || volume === 0 ? 'muted' : 'volume'}/></button><input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} style={{ '--volume': `${muted ? 0 : volume * 100}%` }} onChange={(event) => changeVolume(Number(event.target.value))}/></div>
          <span className="control-time">{formatTime(currentTime)}</span>
        </div>
        <div className="now-playing" title={props.title}>{props.title}</div>
        <div className="controls-right">
          <span className="speed-indicator">{playbackRate}×</span>
          <button className={`control-button subtitle-trigger${subtitlesShowing ? ' is-selected' : ''}`} type="button" onClick={() => setSubtitleMenuOpen((open) => !open)} aria-label="Choose subtitle language" aria-expanded={subtitleMenuOpen} title="Subtitles"><span>CC</span><span aria-hidden="true">⌃</span></button>
          <button className={`control-button pip-trigger${pictureInPicture ? ' is-selected' : ''}`} type="button" onClick={togglePictureInPicture} aria-label={pictureInPicture ? 'Exit picture-in-picture' : 'Picture-in-picture'} title={pictureInPicture ? 'Exit picture-in-picture' : 'Picture-in-picture'}><Icon name="pip"/></button>
          <button className="control-button" type="button" onClick={toggleFull} aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title="Fullscreen (F)"><Icon name="full"/></button>
        </div>
      </div>
      {subtitleMenuOpen && <section className="subtitle-menu" aria-label="Subtitle tracks">
        <div className="subtitle-menu-heading"><div><small>SUBTITLES</small><strong>Choose a subtitle</strong></div><button type="button" onClick={() => setSubtitleMenuOpen(false)} aria-label="Close subtitle menu"><Icon name="close" size={16}/></button></div>
        {subtitleTracks.length ? <div className="subtitle-menu-options" role="listbox" aria-label="Subtitle tracks">{subtitleTracks.map((track) => <button key={track.id} type="button" role="option" aria-selected={track.mode === 'showing'} onClick={() => chooseSubtitleTrack(track)}><span>{track.label || track.language || 'Subtitles'}</span><small>{track.language?.toUpperCase()}</small></button>)}</div> : <p className="setting-hint subtitle-empty">No subtitle track loaded yet.</p>}
        <SubtitleLanguageSelect value={props.externalSubtitleLanguage} onChange={(code) => { props.onSubtitleLanguageChange(code); const track = subtitleTracks.find((item) => item.language === code); if (track) chooseSubtitleTrack(track); }} triggerLabel="＋  Add subtitle" />
        <button className="subtitle-menu-load" type="button" onClick={() => { setSubtitleMenuOpen(false); props.onLoadSubtitle(); }}>{props.externalSubtitle ? 'Choose a different local subtitle file…' : 'Choose a local subtitle file…'}</button>
        {subtitlesShowing && <button className="subtitle-menu-off" type="button" onClick={() => { selectSubtitlesTrack(null); setSubtitleMenuOpen(false); }}>Turn subtitles off</button>}
      </section>}
    </>}
    {props.hasVideo && !paused && <div className="playing-state" aria-hidden="true"/>}
  </div>;
}

function LibraryPanel({ items, activeId, onOpen, onRemove, onToggleSaved, onClose }) {
  const [filter, setFilter] = React.useState('recent');
  const sorted = [...items].sort((a, b) => (b.lastPlayed || b.lastOpened) - (a.lastPlayed || a.lastOpened));
  const visibleItems = filter === 'saved' ? sorted.filter((item) => item.saved) : filter === 'history' ? sorted : sorted.filter((item) => item.lastPlayed || item.lastOpened).slice(0, 12);
  return <section className="side-panel library-panel" aria-label="Video library">
    <div className="panel-header"><div><span className="eyebrow">YOUR COLLECTION</span><h2>Video library</h2></div><button className="panel-close" onClick={onClose} aria-label="Close library"><Icon name="close"/></button></div>
    <div className="library-tabs" role="tablist" aria-label="Library views">{[['recent', 'Recent'], ['saved', 'Saved'], ['history', 'History']].map(([key, label]) => <button key={key} role="tab" aria-selected={filter === key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}{key === 'saved' && items.some((item) => item.saved) ? ` · ${items.filter((item) => item.saved).length}` : ''}</button>)}</div>
    {!visibleItems.length ? <div className="library-empty"><Icon name="library" size={26}/><strong>{filter === 'saved' ? 'No saved videos yet' : filter === 'history' ? 'No playback history yet' : 'Your library is ready'}</strong><span>{filter === 'saved' ? 'Save any video here to keep it close.' : 'Open local videos to build your recent and saved library.'}</span></div> : <div className="library-list">{visibleItems.map((item) => <article className={`library-item${activeId === item.id ? ' current' : ''}`} key={item.id}>
      <button className="library-item-main" type="button" onClick={() => onOpen(item)}><span className="library-thumb"><Icon name="play" size={20}/></span><span className="library-copy"><strong>{item.name}</strong><small>{item.position > 0 ? `Resume at ${formatTime(item.position)}` : item.duration ? `Watched · ${formatTime(item.duration)}` : 'Recently opened'}</small><i><b style={{ width: `${item.duration ? Math.min(100, item.position / item.duration * 100) : 0}%` }}/></i></span><span className="library-go">{activeId === item.id ? 'Playing' : item.position > 0 ? 'Resume' : 'Play'}</span></button>
      <button className={`save-video${item.saved ? ' saved' : ''}`} type="button" onClick={() => onToggleSaved(item.id)} aria-label={`${item.saved ? 'Unsave' : 'Save'} ${item.name}`} title={item.saved ? 'Remove from saved' : 'Save video'}><Icon name="bookmark" size={16}/></button>
      <button className="remove-history" type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name} from history`} title="Remove from library"><Icon name="trash" size={16}/></button>
    </article>)}</div>}
    <div className="local-note">Local videos stay on this device. Playback history is stored in this app.</div>
  </section>;
}

function SubtitleLanguageSelect({ value, onChange, triggerLabel }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const inputId = React.useId();
  const selected = SUBTITLE_LANGUAGES.find((language) => language.code === value) || SUBTITLE_LANGUAGES[0];
  const options = SUBTITLE_LANGUAGES.filter((language) => `${language.name} ${language.code}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="subtitle-language-picker">
    {!triggerLabel && <label htmlFor={inputId}>Subtitle language</label>}
    <div className="language-picker">
      {triggerLabel ? <button className="subtitle-add-button" type="button" role="combobox" aria-expanded={open} aria-controls={inputId} onClick={() => { setQuery(''); setOpen((current) => !current); }} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}>{triggerLabel}</button> : <input id={inputId} className="subtitle-language-input" type="search" role="combobox" aria-expanded={open} aria-controls={inputId} aria-autocomplete="list" value={open ? query : selected.name} placeholder="Search languages…" onFocus={() => { setQuery(''); setOpen(true); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); if (event.key === 'Enter' && options[0]) { event.preventDefault(); onChange(options[0].code); setOpen(false); setQuery(''); } }}/>}
      {open && <><input className="language-dropdown-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); } if (event.key === 'Enter' && options[0]) { event.preventDefault(); onChange(options[0].code); setOpen(false); setQuery(''); } }} placeholder="Search languages…" aria-label="Search subtitle languages" autoFocus/><ul className="language-options" id={inputId} role="listbox" aria-label="Subtitle languages">{options.map((language) => <li key={language.code}><button type="button" role="option" aria-selected={language.code === value} onClick={() => { onChange(language.code); setOpen(false); setQuery(''); }}>{language.name}<small>{language.code.toUpperCase()}</small></button></li>)}{!options.length && <li className="language-no-results">No matching language</li>}</ul></>}
    </div>
  </div>;
}

function SubtitleControls({ tracks, subtitlesShowing, selectSubtitlesTrack, externalSubtitle, externalSubtitleLanguage, onLanguageChange, onLoadSubtitle }) {
  const subtitleTracks = (tracks || []).filter((track) => ['captions', 'subtitles'].includes(track.kind));
  return <section className="setting-section subtitle-section">
    <h3>Subtitles</h3>
    {subtitleTracks.length ? <div className="subtitle-track-list">
      <button className="setting-row" type="button" onClick={() => selectSubtitlesTrack(null)}><span>Off</span><span>{subtitlesShowing ? '' : '✓'}</span></button>
      {subtitleTracks.map((track) => <button key={track.id} className="setting-row" type="button" onClick={() => selectSubtitlesTrack(track.id)}><span>{track.label || track.language || 'Subtitles'}</span><span>{track.mode === 'showing' ? '✓' : ''}</span></button>)}
    </div> : <p className="setting-hint">No subtitle track loaded yet.</p>}
    <div className="subtitle-add-controls"><SubtitleLanguageSelect value={externalSubtitleLanguage} onChange={(code) => { onLanguageChange(code); const track = subtitleTracks.find((item) => item.language === code); if (track) selectSubtitlesTrack(track.id); }} triggerLabel="＋  Add subtitle"/></div>
  </section>;
}

function SettingsPanel({ settings, onChange, rates, playbackRate, setPlaybackRate, tracks, subtitlesShowing, selectSubtitlesTrack, externalSubtitle, externalSubtitleLanguage, onSubtitleLanguageChange, onLoadSubtitle, audioTracks, selectAudioTrack, onClose, cloudUser, cloudStatus, cloudBusy, onCloudAuth, onCloudSignOut, onCloudSync }) {
  return <section className="side-panel settings-panel" aria-label="Player settings">
    <div className="panel-header"><div><span className="eyebrow">PLAYER PREFERENCES</span><h2>Settings</h2></div><button className="panel-close" onClick={onClose} aria-label="Close settings"><Icon name="close"/></button></div>
    <div className="settings-content">
      <section className="setting-section"><h3>Playback speed <span>{playbackRate}×</span></h3><div className="rate-options">{rates.map((rate) => <button key={rate} type="button" className={playbackRate === rate ? 'active' : ''} onClick={() => setPlaybackRate(rate)}>{rate === 1 ? 'Normal' : `${rate}×`}</button>)}</div></section>
      <SubtitleControls tracks={tracks} subtitlesShowing={subtitlesShowing} selectSubtitlesTrack={selectSubtitlesTrack} externalSubtitle={externalSubtitle} externalSubtitleLanguage={externalSubtitleLanguage} onLanguageChange={onSubtitleLanguageChange} onLoadSubtitle={onLoadSubtitle}/>
      <section className="setting-section"><h3>Audio track</h3>{audioTracks?.length ? audioTracks.map((track) => <button key={track.id} className="setting-row" type="button" onClick={() => selectAudioTrack(track.id)}><span>{track.label || track.language || `Track ${track.id}`}</span><span>{track.enabled ? '✓' : ''}</span></button>) : <p className="setting-hint">Audio track selection is available when a video provides multiple tracks.</p>}</section>
      <section className="setting-section"><h3>Playback preferences</h3><button className="setting-row" type="button" onClick={() => onChange({ ...settings, resume: !settings.resume })}><span>Resume where I stopped</span><span className={`toggle${settings.resume ? ' enabled' : ''}`}/></button><button className="setting-row" type="button" onClick={() => onChange({ ...settings, rememberVolume: !settings.rememberVolume })}><span>Remember volume level</span><span className={`toggle${settings.rememberVolume ? ' enabled' : ''}`}/></button><button className="setting-row" type="button" onClick={() => onChange({ ...settings, defaultSpeed: settings.defaultSpeed === 1 ? 1.25 : 1 })}><span>Default speed</span><span>{settings.defaultSpeed}×</span></button></section>
      <CloudAccountSection user={cloudUser} status={cloudStatus} busy={cloudBusy} onAuth={onCloudAuth} onSignOut={onCloudSignOut} onSync={onCloudSync}/>
      <section className="setting-section shortcuts"><h3>Keyboard shortcuts</h3><p><kbd>Space</kbd> Play or pause</p><p><kbd>←</kbd> <kbd>→</kbd> Seek 5 seconds · <kbd>Shift</kbd> + arrow seeks 30</p><p><kbd>M</kbd> Mute · <kbd>F</kbd> Fullscreen</p><p><kbd>[</kbd> <kbd>]</kbd> Change speed · <kbd>N</kbd> / <kbd>P</kbd> Next / previous</p></section>
    </div>
  </section>;
}

function CloudAccountSection({ user, status, busy, onAuth, onSignOut, onSync }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [createAccount, setCreateAccount] = React.useState(false);
  return <section className="setting-section cloud-account-section">
    <h3>Cloud library</h3>
    <p className="setting-hint">Syncs titles, saved state and resume positions. Your video and subtitle files stay on this device.</p>
    {user ? <>
      <p className="cloud-account-email">Signed in as <strong>{user.email}</strong></p>
      <div className="cloud-actions"><button type="button" disabled={busy} onClick={onSync}>Sync now</button><button type="button" onClick={onSignOut}>Sign out</button></div>
    </> : isSupabaseConfigured ? <form className="cloud-auth-form" onSubmit={(event) => { event.preventDefault(); onAuth(email.trim(), password, createAccount); }}>
      <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/></label>
      <label>Password<input type="password" autoComplete={createAccount ? 'new-password' : 'current-password'} minLength="6" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters"/></label>
      <button className="cloud-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : createAccount ? 'Create account' : 'Sign in'}</button>
      <button className="cloud-mode-toggle" type="button" onClick={() => setCreateAccount((value) => !value)}>{createAccount ? 'Already have an account? Sign in' : 'New here? Create an account'}</button>
    </form> : null}
    <p className="cloud-status" role="status">{status}</p>
  </section>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);

