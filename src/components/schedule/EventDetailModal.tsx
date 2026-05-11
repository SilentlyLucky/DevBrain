"use client";
import { useState } from "react";
import { X, FileText, Check, Trash2, Tag, Pencil, ArrowRight, Calendar, } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Schedule } from "@/types";
import { updateScheduleStatus, deleteSchedule, updateSchedule,} from "@/actions/schedules";
import { useToast } from "@/components/ui/toast-notification";
import { useRouter } from "next/navigation";
import type { ScheduleStatus } from "@/types";

interface Props {
  event: Schedule | null;
  onClose: () => void;
}

function parseDescription(desc: string | null | undefined): {
  category: string | null;
  text: string;
} {
  if (!desc) return { category: null, text: "" };
  const match = desc.match(/^\[([^\]]+)\](.*)/);
  if (match) return { category: match[1].trim(), text: match[2].trim() };
  return { category: null, text: desc };
}

function isScheduleStatus(status: string): status is ScheduleStatus {
  return ["Upcoming", "Completed", "Missed"].includes(status);
}

function formatDuration(start: string, end: string): string {
  const diff = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  );
  if (diff <= 0) return "";
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const REMINDER_PRESETS = [
  { label: "No reminder", value: null },
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "3 hours before", value: 180 },
  { label: "1 day before", value: 1440 },
] as const;

const STATUS_BADGE: Record<string, string> = {
  Completed: "bg-green-400/15 text-green-400 border-green-400/30",
  Upcoming: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  Missed: "bg-red-400/15 text-red-400 border-red-400/30",
};

const inputCls =
  "w-full rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all px-3 border-muted bg-surface/50 text-foreground focus:ring-primary/30 focus:border-primary/50";

export function EventDetailModal({ event, onClose }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editReminder, setEditReminder] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<
    "Upcoming" | "Completed" | "Missed"
  >("Upcoming");

  if (!event) return null;
  const currentEvent = event;

  const { category, text: descText } = parseDescription(event.description);
  const duration = formatDuration(event.start_time, event.end_time);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  function startEdit() {
    setEditTitle(currentEvent.title);
    setEditCategory(category ?? "");
    setEditDesc(descText);
    setEditStart(toDateTimeLocal(currentEvent.start_time));
    setEditEnd(toDateTimeLocal(currentEvent.end_time));

    const rm = currentEvent.reminder_minutes;
    setEditReminder(REMINDER_PRESETS.find((p) => p.value === rm) ? rm : null);

    setEditStatus(
      isScheduleStatus(currentEvent.status) ? currentEvent.status : "Upcoming",
    );

    setIsEditing(true);
  }

  async function handleSave() {
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!editStart || !editEnd) {
      toast.error("Start and end time are required");
      return;
    }
    if (new Date(editEnd) <= new Date(editStart)) {
      toast.error("End time must be after start time");
      return;
    }

    const fullDesc = editCategory.trim()
      ? `[${editCategory.trim()}]${editDesc.trim() ? " " + editDesc.trim() : ""}`
      : editDesc.trim() || null;

    setLoading(true);
    try {
      await updateSchedule(currentEvent.id, {
        title: editTitle.trim(),
        description: fullDesc,
        start_time: new Date(editStart).toISOString(),
        end_time: new Date(editEnd).toISOString(),
        status: editStatus,
        reminder_minutes: editReminder,
      });
      toast.success("Schedule updated");
      router.refresh();
      setIsEditing(false);
      onClose();
    } catch {
      toast.error("Failed to update schedule");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(status: "Completed") {
    setLoading(true);
    try {
      await updateScheduleStatus(currentEvent.id, status);
      toast.success(`Marked as ${status}`);
      router.refresh();
      onClose();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = await toast.confirm(
      `Delete "${currentEvent.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      await deleteSchedule(currentEvent.id);
      toast.success("Schedule deleted");
      router.refresh();
      onClose();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={() => {
          if (!isEditing) onClose();
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] bg-surface-2 border border-muted/50 ring-1 ring-white/5">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10 pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-start justify-between px-6 py-5 border-b border-muted/50 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-bold leading-snug tracking-tight text-foreground">
              {isEditing ? "Edit Schedule" : event.title}
            </h2>
            {!isEditing && category && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-violet-500/10 text-violet-400">
                  <Tag className="w-3 h-3" />
                </div>
                <span className="text-xs font-semibold tracking-wide text-violet-400 uppercase">
                  {category}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isEditing && (
              <span
                className={cn(
                  "text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-wider",
                  STATUS_BADGE[event.status],
                )}
              >
                {event.status}
              </span>
            )}
            {!isEditing && (
              <button
                onClick={startEdit}
                className="p-2 rounded-xl transition-all text-muted-foreground hover:text-primary hover:bg-primary/10 bg-surface border border-transparent hover:border-primary/20"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                if (isEditing) setIsEditing(false);
                else onClose();
              }}
              className="p-2 rounded-xl transition-all text-muted-foreground hover:text-red-400 hover:bg-red-400/10 bg-surface border border-transparent hover:border-red-400/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isEditing ? (
          /* Edit form */
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Title *
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={`${inputCls} h-10`}
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Category <span className="opacity-50">(optional)</span>
                </label>
                <input
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="e.g. Study, Work, Personal"
                  className={`${inputCls} h-10`}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Notes <span className="opacity-50">(optional)</span>
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  placeholder="Add notes or details…"
                  className={`${inputCls} py-2.5 resize-none`}
                />
              </div>

              {/* Start time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Start *
                </label>
                <input
                  type="datetime-local"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className={`${inputCls} h-10`}
                />
              </div>

              {/* End time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  End *
                </label>
                <input
                  type="datetime-local"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  className={`${inputCls} h-10`}
                />
              </div>

              {/* Reminder */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Reminder <span className="opacity-50">(optional)</span>
                </label>
                <select
                  value={editReminder === null ? "null" : String(editReminder)}
                  onChange={(e) =>
                    setEditReminder(
                      e.target.value === "null" ? null : Number(e.target.value),
                    )
                  }
                  className={`${inputCls} h-10`}
                >
                  {REMINDER_PRESETS.map((p) => (
                    <option
                      key={String(p.value)}
                      value={p.value === null ? "null" : String(p.value)}
                    >
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isScheduleStatus(value)) {
                      setEditStatus(value);
                    }
                  }}
                  className={`${inputCls} h-10`}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                  <option value="Missed">Missed</option>
                </select>
              </div>
            </div>

            {/* Edit footer */}
            <div className="shrink-0 px-6 pb-5 flex gap-2.5 pt-4 border-t border-muted/50 bg-surface/30">
              <button
                onClick={() => setIsEditing(false)}
                disabled={loading}
                className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 bg-surface border border-muted hover:bg-muted/50 text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !editTitle.trim()}
                className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-[0.98] bg-gradient-to-r from-primary to-violet-500 hover:brightness-110 shadow-md shadow-primary/20"
              >
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </>
        ) : (
          /* View mode */
          <>
            <div className="px-6 py-5 space-y-4">
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold tracking-tight text-foreground/90">
                  {fmtDate(event.start_time)}
                </span>
              </div>

              {/* Modern Time block (replaces em dash) */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-surface rounded-xl p-3 border border-muted flex flex-col shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-400/50" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1 pl-1">
                    Start Time
                  </span>
                  <span className="text-xl font-black text-foreground tracking-tight pl-1">
                    {fmtTime(event.start_time)}
                  </span>
                </div>

                <div className="w-6 flex justify-center text-muted-foreground/50">
                  <ArrowRight className="w-5 h-5" />
                </div>

                <div className="flex-1 bg-surface rounded-xl p-3 border border-muted flex flex-col shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400/50" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1 pl-1">
                    End Time
                  </span>
                  <span className="text-xl font-black text-foreground tracking-tight pl-1">
                    {fmtTime(event.end_time)}
                  </span>
                </div>
              </div>

              {duration && (
                <div className="flex justify-center mt-2">
                  <span className="text-xs font-semibold text-primary/80 bg-primary/10 px-3 py-1 rounded-full">
                    Duration: {duration}
                  </span>
                </div>
              )}

              {/* Description */}
              {descText && (
                <div className="rounded-xl p-4 mt-2 bg-surface border border-muted shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted text-muted-foreground">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      Notes
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {descText}
                  </p>
                </div>
              )}
            </div>

            {/* View actions */}
            <div className="px-6 pb-6 flex gap-3">
              {event.status !== "Completed" && (
                <button
                  onClick={() => handleStatus("Completed")}
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98] bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/30"
                >
                  <Check className="w-4 h-4" /> Complete Task
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={loading}
                title="Delete"
                className="h-11 w-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shrink-0 active:scale-[0.98] bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
