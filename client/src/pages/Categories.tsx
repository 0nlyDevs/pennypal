import { useEffect, useMemo, useState } from "react";
import { useToast } from "../ui";
import { CategoryService } from "../services/CategoryService";
import type { Category } from "../types/Auth";
import type { SortOrder } from "../types/Category";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { usePersistedState } from "../hooks/usePersistedState";
import { useCategoryMonthlyTotals } from "../hooks/useCategoryMonthlyTotals";
import CategoriesHeader from "../components/categories/Header";
import CategoriesSkeletonList from "../components/categories/skeletons/SkeletonList";
import CategoriesSkeletonGrid from "../components/categories/skeletons/SkeletonGrid";
import CreateForm from "../components/categories/CreateForm";
import ListView from "../components/categories/ListView";
import GridView from "../components/categories/GridView";
import CategoriesEmptyState from "../components/categories/EmptyState";
import { applyCategoryFilterSort } from "../utils/categoryFilterSort";
import DeleteConfirmationModal from "../components/categories/modals/DeleteConfirmationModal";
import BulkDeleteModal from "../components/categories/modals/BulkDeleteModal";
import { useSelection } from "../hooks/useSelection";
import CategoryDetailsModal from "../components/categories/modals/CategoryDetailsModal";
import DataHeader from "../components/categories/DataHeader";
import Pagination from "../components/categories/Pagination";
import BulkFloatingAction from "../components/categories/BulkFloatingAction";
import PageContainer from "../components/common/PageContainer";

export default function Categories() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [viewMode, setViewMode] = usePersistedState<"list" | "grid">("categories:viewMode", "list");
  const [searchQuery, setSearchQuery] = usePersistedState<string>("categories:search", "");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [sortOrder, setSortOrder] = usePersistedState<SortOrder>("categories:sortOrder", "name_asc");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string | undefined>(undefined);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const userCategories = useMemo(() => list.filter(c => c.user_id != null), [list]);
  const filteredCategories = useMemo(() => {
    return applyCategoryFilterSort(userCategories, debouncedQuery, sortOrder);
  }, [userCategories, debouncedQuery, sortOrder]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === "grid" ? 9 : 10;
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));
  const displayedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage, itemsPerPage]);

  // reset page when filters/view change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, sortOrder, viewMode]);

  const {
    bulkMode,
    toggleBulkMode,
    selectedIds,
    toggleSelect,
    clear: clearSelection,
  } = useSelection(filteredCategories, (c) => c.category_id);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await CategoryService.safeListAll();
    if (error) toast.error(error);
    if (data) setList(data);
    setLoading(false);
  };

  useEffect(() => {
    void fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetCreate = () => {
    setName("");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const { data, error } = await CategoryService.safeCreate({ name: name.trim() });
    if (error) toast.error(error);
    if (data) {
      setList(prev => [...prev, data]);
      resetCreate();
      toast.success("Category created");
    }
    setSaving(false);
  };

  const startEdit = (c: Category) => {
    setEditingId(c.category_id);
    setEditName(c.category_name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const { data, error } = await CategoryService.safeUpdate(id, { name: editName.trim() });
    if (error) toast.error(error);
    if (data) {
      setList(prev => prev.map(c => (c.category_id === id ? data : c)));
      toast.success("Category updated");
      cancelEdit();
    }
    setSaving(false);
  };

  const remove = async (id: number) => {
    setPendingDeleteId(id);
    const cat = list.find(c => c.category_id === id);
    setPendingDeleteName(cat?.category_name);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (pendingDeleteId == null) return;
    setSaving(true);
    const { error } = await CategoryService.safeRemove(pendingDeleteId);
    if (error) {
      toast.error(error);
    } else {
      setList(prev => prev.filter(c => c.category_id !== pendingDeleteId));
      toast.success("Category deleted");
    }
    setSaving(false);
    setDeleteOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName(undefined);
  };

  const { totalsThisMonth } = useCategoryMonthlyTotals();

  const openDetails = (c: Category) => {
    setSelectedCategory(c);
    setDetailsOpen(true);
  };

  return (
    <PageContainer className="text-light">
      <CategoriesHeader
        bulkMode={bulkMode}
        onToggleBulkMode={() => toggleBulkMode()}
        selectedCount={selectedIds.length}
        onBulkDelete={() => setBulkOpen(true)}
      />

      <CreateForm
        name={name}
        saving={saving}
        onNameChange={setName}
        onCreate={handleCreate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {loading && (
        <div className="py-4">{viewMode === 'list' ? <CategoriesSkeletonList /> : <CategoriesSkeletonGrid />}</div>
      )}

      {!loading && (
        <div className="relative overflow-hidden rounded-2xl bg-white/25 dark:bg-gradient-to-br dark:bg-transparent dark:from-primary-light/10 dark:to-primary-dark/10 backdrop-blur-xl border border-gray-200/70 dark:border-white/5 shadow-lg p-4 md:p-6">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-16 translate-x-16 bg-accent/10 dark:bg-accent/5"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full translate-y-12 -translate-x-12 bg-cyan-400/10 dark:bg-cyan-400/5"></div>
          <DataHeader
            viewMode={viewMode}
            onToggleView={() => setViewMode((v) => (v === "list" ? "grid" : "list"))}
            sortOrder={sortOrder}
            onSortChange={(v) => setSortOrder(v)}
          />

          {filteredCategories.length === 0 ? (
            <CategoriesEmptyState
              onRefresh={fetch}
              message={searchQuery.trim() ? 'No categories match your search' : 'No categories found'}
            />
          ) : (
            <>
              {viewMode === "list" ? (
                <ListView
                  categories={displayedCategories}
                  editingId={editingId}
                  editName={editName}
                  onEditNameChange={setEditName}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onRemove={remove}
                  saving={saving}
                  highlightQuery={debouncedQuery}
                  totalsThisMonth={totalsThisMonth}
                  bulkMode={bulkMode}
                  selectedIds={selectedIds as number[]}
                  onToggleSelect={(id) => toggleSelect(id)}
                  onOpenDetails={openDetails}
                />
              ) : (
                <GridView
                  categories={displayedCategories}
                  editingId={editingId}
                  editName={editName}
                  onEditNameChange={setEditName}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onRemove={remove}
                  saving={saving}
                  highlightQuery={debouncedQuery}
                  totalsThisMonth={totalsThisMonth}
                  bulkMode={bulkMode}
                  selectedIds={selectedIds as number[]}
                  onToggleSelect={(id) => toggleSelect(id)}
                  onOpenDetails={openDetails}
                />
              )}
              {displayedCategories.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                />
              )}
            </>
          )}
        </div>
      )}

      <BulkFloatingAction
        bulkMode={bulkMode}
        selectedCount={selectedIds.length}
        onClick={() => setBulkOpen(true)}
      />
      <DeleteConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={saving}
        categoryName={pendingDeleteName}
      />

      <BulkDeleteModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onConfirm={async () => {
          if (!selectedIds.length) { setBulkOpen(false); return; }
          setSaving(true);
          const results = await Promise.allSettled(selectedIds.map((id) => CategoryService.safeRemove(id)));
          let success = 0; let failed = 0;
          results.forEach((r) => {
            if (r.status === 'fulfilled' && !r.value.error) {
              success++;
            } else {
              failed++;
            }
          });
          if (success) {
            setList((prev) => prev.filter((c) => !selectedIds.includes(c.category_id)));
          }
          if (success) toast.success(`${success} deleted`);
          if (failed) toast.error(`${failed} failed`);
          setSaving(false);
          setBulkOpen(false);
          clearSelection();
        }}
        loading={saving}
        names={list.filter((c) => selectedIds.includes(c.category_id)).map((c) => c.category_name)}
      />

      <CategoryDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        category={selectedCategory}
        totalThisMonth={selectedCategory ? totalsThisMonth?.[selectedCategory.category_id] ?? 0 : 0}
        onEdit={(c) => {
          setDetailsOpen(false);
          startEdit(c);
        }}
        onDelete={(c) => {
          setDetailsOpen(false);
          remove(c.category_id);
        }}
      />
    </PageContainer>
  );
}
