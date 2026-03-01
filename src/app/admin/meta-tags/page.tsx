"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Loader2 } from "lucide-react";

type MetaTag = {
  id: string;
  name: string;
  content: string;
};

export default function AdminMetaTagsPage() {
  const [tags, setTags] = useState<MetaTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/admin/meta-tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      const data = await res.json();
      setTags(data);
    } catch (err) {
      setError("Meta teqləri yükləmək mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/meta-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, content: newContent }),
      });
      if (!res.ok) throw new Error("Failed to add tag");
      const newTag = await res.json();
      setTags([newTag, ...tags]);
      setNewName("");
      setNewContent("");
      setIsAdding(false);
    } catch (err) {
      alert("Xəta baş verdi: " + err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim() || !editContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/meta-tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editName,
          content: editContent,
        }),
      });
      if (!res.ok) throw new Error("Failed to update tag");
      const updatedTag = await res.json();
      setTags(tags.map((t) => (t.id === editingId ? updatedTag : t)));
      setEditingId(null);
    } catch (err) {
      alert("Xəta baş verdi: " + err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu meta teqi silmək istədiyinizə əminsiniz?")) return;
    try {
      const res = await fetch(`/api/admin/meta-tags?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete tag");
      setTags(tags.filter((t) => t.id !== id));
    } catch (err) {
      alert("Silinmə zamanı xəta baş verdi.");
    }
  };

  const startEdit = (tag: MetaTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditContent(tag.content);
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meta Teqlər</h1>
          <p className="text-sm text-slate-500">
            Saytın SEO və sosial media paylaşımları üçün meta teqləri idarə edin.
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} />
            Yeni Teq
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Yeni Meta Teq</h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Name / Property</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="məs: description, og:title"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Content</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="Teqin dəyəri..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Ləğv et
            </button>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Yadda saxla
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Name / Property</th>
                <th className="px-6 py-4 font-medium">Content</th>
                <th className="px-6 py-4 font-medium text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tags.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Heç bir meta teq tapılmadı.
                  </td>
                </tr>
              ) : (
                tags.map((tag) => (
                  <tr key={tag.id} className="group hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900 w-1/4">
                      {editingId === tag.id ? (
                        <input
                          className="w-full rounded-lg border border-emerald-500 px-3 py-1.5 outline-none"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        tag.name
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {editingId === tag.id ? (
                        <input
                          className="w-full rounded-lg border border-emerald-500 px-3 py-1.5 outline-none"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                      ) : (
                        <div className="max-w-md truncate" title={tag.content}>
                          {tag.content}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === tag.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 text-slate-400 hover:text-slate-600"
                            title="Ləğv et"
                          >
                            <X size={18} />
                          </button>
                          <button
                            onClick={handleUpdate}
                            disabled={saving}
                            className="p-2 text-emerald-600 hover:text-emerald-700"
                            title="Yadda saxla"
                          >
                            {saving ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Save size={18} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => startEdit(tag)}
                            className="p-2 text-slate-400 hover:text-emerald-600"
                            title="Redaktə et"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id)}
                            className="p-2 text-slate-400 hover:text-red-600"
                            title="Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
