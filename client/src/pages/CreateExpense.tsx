import { useState } from "react";
import type React from "react";
import { useNavigate } from "react-router-dom";
import { Button, useToast } from "../ui";
import { ExpenseService } from "../services/ExpenseService";
import { useCategories } from "../hooks/useCategories";
import type { CreateExpenseRequest, ExpenseType } from "../types/Expense";
import { Loader2 } from "lucide-react";
import GlassSelect from "../components/expense/GlassSelect";
import { GlassDatePicker } from "../components/common/GlassDatePicker";
import PageContainer from "../components/common/PageContainer";

export const CreateExpense = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { categories, loading: categoriesLoading } = useCategories();

  const [form, setForm] = useState<CreateExpenseRequest>({
    amount: "",
    description: "",
    type: "one-time",
    date: "",
    startDate: "",
    endDate: "",
    categoryId: "",
    receipt: undefined,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const formatDate = (d: Date | null): string => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (
      !["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(
        f.type
      )
    ) {
      toast.error(`Unsupported file type: ${f.type}`);
      e.currentTarget.value = "";
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error(`File too large: ${f.size / 1024 / 1024} > 5 Mo`);
      e.currentTarget.value = "";
      return;
    }
    setForm((prev) => ({ ...prev, receipt: f }));
  };

  const validate = (): string | null => {
    if (!form.amount) return "Amount is required";
    if (!form.categoryId) return "Category is required";
    if ((form.type as ExpenseType) === "one-time") {
      if (!form.date) return "Date is required for one-time expense";
    } else if ((form.type as ExpenseType) === "recurring") {
      if (!form.startDate)
        return "Start date is required for recurring expense";
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    try {
      setIsLoading(true);
      await ExpenseService.createExpense({
        amount: form.amount,
        description: form.description || undefined,
        type: (form.type as ExpenseType) || undefined,
        date: form.type === "one-time" ? form.date || undefined : undefined,
        startDate:
          form.type === "recurring" ? form.startDate || undefined : undefined,
        endDate:
          form.type === "recurring" ? form.endDate || undefined : undefined,
        categoryId: form.categoryId,
        receipt: form.receipt,
      });
      toast.success("Expense created successfully");
      navigate("/expenses");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create expense";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/expenses");
  };

  return (
    <PageContainer maxWidth="2xl" className="text-gray-800 dark:text-light">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-semibold">Create New Expense</h1>
      </div>

      <div className="dark:bg-white/10 bg-white/50 backdrop-blur rounded-lg border border-white/10 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Amount</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={onChange}
              className="w-full rounded-md dark:bg-white/10 bg-white/75 border border-white/10 px-3 py-2 outline-none"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Category</label>
            <GlassSelect
              value={form.categoryId || null}
              onChange={(v) =>
                setForm((f) => ({ ...f, categoryId: String(v) }))
              }
              options={categories.map((c) => ({
                label: c.category_name,
                value: String(c.category_id),
              }))}
              placeholder="Select a category"
              disabled={categoriesLoading}
              classes={{
                option: "!bg-white dark:!bg-white/10 !border !border-white/10",
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <input
            name="description"
            type="text"
            value={form.description || ""}
            onChange={onChange}
            className="w-full rounded-md dark:bg-white/10 bg-white/75 border border-white/10 px-3 py-2 outline-none"
            placeholder="Optional"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Type</label>
            <GlassSelect
              value={form.type ?? null}
              onChange={(v) =>
                setForm((f) => ({ ...f, type: String(v) as ExpenseType }))
              }
              options={[
                { label: "One-time", value: "one-time" },
                { label: "Recurring", value: "recurring" },
              ]}
              placeholder="Select type"
            />
          </div>
          {form.type === "one-time" && (
            <div>
              <label className="block text-sm mb-1">Date</label>
              <GlassDatePicker
                value={form.date ? new Date(form.date) : null}
                onChange={(d) =>
                  setForm((f) => ({ ...f, date: formatDate(d) }))
                }
                placeholder="Select date"
              />
            </div>
          )}
          {form.type === "recurring" && (
            <>
              <div>
                <label className="block text-sm mb-1">Start Date</label>
                <GlassDatePicker
                  value={form.startDate ? new Date(form.startDate) : null}
                  onChange={(d) =>
                    setForm((f) => ({ ...f, startDate: formatDate(d) }))
                  }
                  placeholder="Start date"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">End Date</label>
                <GlassDatePicker
                  value={form.endDate ? new Date(form.endDate) : null}
                  onChange={(d) =>
                    setForm((f) => ({ ...f, endDate: formatDate(d) }))
                  }
                  placeholder="End date"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Receipt (optional)</label>
          <input type="file" onChange={onFile} className="w-full rounded-md dark:bg-white/10 bg-white/75 border border-dashed border-gray-300 px-3 py-2 outline-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 justify-end">
          <Button onClick={handleCancel} className="bg-white  border dark:bg-white/10 dark:hover:bg-white/15 dark:border-light/10 border-light/10 hover:border-light/50 hover:shadow-lg">
            Cancel
          </Button>
          <Button onClick={handleSave}
          className="border-accent/10 text-accent bg-white/80 bg-gradient-to-br from-accent/10 to-accent/20 hover:shadow-lg hover:bg-white/90 dark:bg-accent/10 dark:from-accent/10 dark:to-accent/10 dark:hover:bg-accent/15 dark:border-accent/10 font-semibold">
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin" />
                Saving your expense
              </div>
            ) : (
              "Save Expense"
            )}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};
