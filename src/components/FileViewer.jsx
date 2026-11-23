import { useEffect, useState } from "react";
import { api, openFile, saveBlob } from "../lib/api";
import { fmtDateTime } from "../lib/format";
import { DownloadIcon, FileIcon } from "./icons";
import { Spinner } from "./ui";

// Documents list (middle column) + preview (right column) of the detail pages.
// groups: [{ title, files: [{ id, label, contentType, uploadedAt }] }]
// basePath: the API path the file ids hang off, e.g. "/clients/ABCDE1234F/files"
export function useFilePreview(basePath) {
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => preview?.blob && URL.revokeObjectURL(preview.url), [preview]);

  const view = async (file) => {
    setSelected(file);
    setError("");
    setBusy(true);
    try {
      setPreview({ ...(await openFile(`${basePath}/${encodeURIComponent(file.id)}`)), file });
    } catch (err) {
      setPreview(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const download = async (file) => {
    setError("");
    try {
      const info = await openFile(`${basePath}/${encodeURIComponent(file.id)}`, { download: true });
      if (info.blob) {
        const blob = await (await fetch(info.url)).blob();
        saveBlob(blob, info.name || file.label);
        URL.revokeObjectURL(info.url);
      } else {
        window.location.assign(info.url); // signed link with "attachment"
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Opens a file in a new browser tab (for long files like the Aadhaar XML).
  // The tab is opened right on the click, so the browser doesn't block it as
  // a pop-up, and pointed at the file once its link is ready.
  const openInTab = async (file) => {
    setError("");
    const tab = window.open("", "_blank");
    try {
      const info = await openFile(`${basePath}/${encodeURIComponent(file.id)}`);
      if (tab) tab.location.href = info.url;
      else window.location.assign(info.url);
    } catch (err) {
      tab?.close();
      setError(err.message);
    }
  };

  return { selected, preview, error, busy, view, download, openInTab };
}

export function DocumentsPanel({ groups, viewer }) {
  const [s3, setS3] = useState(null);
  const checkS3 = async () => {
    setS3({ checking: true });
    try {
      setS3(await api.get("/s3-check"));
    } catch (err) {
      setS3({ ok: false, message: err.message });
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="bg-violet-50 px-4 py-3 text-center text-sm font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">Documents</div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {groups.map((group) => (
          <div key={group.title} className="px-3 py-3">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.title}</p>
            {group.files.length ? group.files.map((file) => (
              <div
                key={file.id}
                className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${viewer.selected?.id === file.id ? "bg-violet-50 dark:bg-violet-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}
              >
                <FileIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <button type="button" onClick={() => (file.openOnly ? viewer.openInTab(file) : viewer.view(file))} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-medium text-slate-700 dark:text-slate-200">{file.label}</span>
                  {file.uploadedAt && <span className="block text-xs text-slate-400">{fmtDateTime(file.uploadedAt)}</span>}
                </button>
                {file.openOnly && (
                  <button type="button" title="Open in a new tab" onClick={() => viewer.openInTab(file)} className="rounded-md px-2 py-1 text-xs font-medium text-violet-600 hover:bg-white dark:text-violet-400 dark:hover:bg-slate-900">
                    Open
                  </button>
                )}
                <button type="button" title="Download" onClick={() => viewer.download(file)} className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-violet-600 dark:hover:bg-slate-900">
                  <DownloadIcon className="h-4 w-4" />
                </button>
              </div>
            )) : <p className="px-1 py-2 text-sm text-slate-400">No files</p>}
          </div>
        ))}
      </div>
      {viewer.error && <p className="border-t border-slate-100 px-4 py-3 text-center text-sm text-red-500 dark:border-slate-800">{viewer.error}</p>}
      <div className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
        <button type="button" className="link" onClick={checkS3}>Check S3 connection</button>
        {s3 && (s3.checking
          ? <span className="ml-2 text-slate-400">Checking…</span>
          : <p className={`mt-1 ${s3.ok ? "text-emerald-600" : "text-red-500"}`}>{s3.message}</p>)}
      </div>
    </div>
  );
}

export function PreviewPanel({ viewer }) {
  const { preview, busy } = viewer;
  const type = preview?.contentType || "";
  return (
    <div className="card flex min-h-[420px] flex-col p-3 lg:min-h-[560px]">
      {preview && (
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{preview.file.label}</p>
          <div className="flex gap-2">
            <a href={preview.url} target="_blank" rel="noreferrer" className="btn-outline btn-sm">Open</a>
            <button type="button" className="btn-outline btn-sm" onClick={() => viewer.download(preview.file)}>Download</button>
          </div>
        </div>
      )}
      <div className="flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-200 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:14px_14px] dark:border-slate-700 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]">
        {busy ? <Spinner /> : !preview ? (
          <span className="text-sm text-slate-400">Select a document</span>
        ) : type.startsWith("image/") ? (
          <img src={preview.url} alt={preview.file.label} className="max-h-[70vh] max-w-full object-contain" />
        ) : type === "application/pdf" ? (
          <iframe src={preview.url} title={preview.file.label} className="h-[70vh] w-full rounded-lg bg-white" />
        ) : type.startsWith("video/") ? (
          <video src={preview.url} controls className="max-h-[70vh] max-w-full rounded-lg bg-black" />
        ) : (
          <a href={preview.url} target="_blank" rel="noreferrer" className="link">Open {preview.file.label}</a>
        )}
      </div>
    </div>
  );
}
