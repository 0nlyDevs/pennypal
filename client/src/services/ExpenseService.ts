import { DefaultService } from "../api/services/DefaultService";
import { API_BASE } from "../lib/api";
import { useMascotStore } from "../stores/mascotStore";
import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from "../types/Expense";
type ApiEnvelope<T> = { success: boolean; data: T };
function hasData<T>(r: unknown): r is { data: T } {
  return (
    typeof r === "object" &&
    r !== null &&
    "data" in (r as Record<string, unknown>)
  );
}
function unwrap<T>(response: unknown): T {
  return hasData<T>(response)
    ? (response as ApiEnvelope<T>).data
    : (response as T);
}
function appendIf(fd: FormData, key: string, v: unknown) {
  if (v === undefined || v === null || v === "") return;
  if (v instanceof Blob) fd.append(key, v);
  else fd.append(key, String(v));
}

export class ExpenseService {
  // GET all expenses with optional filtering
  static async getExpenses(
    start?: string,
    end?: string,
    category?: string,
    type?: "recurring" | "one-time"
  ) {
    try {
      const response = await DefaultService.getExpenses(
        start,
        end,
        category,
        type
      );
      useMascotStore.getState().setExpression("success");
      return unwrap<Expense[]>(response);
    } catch (error) {
      useMascotStore.getState().setExpression("error");
      console.error("Error fetching expenses:", error);
      throw new Error("Failed to fetch expenses");
    }
  }

  // GET expense by id
  static async getExpenseById(id: string) {
    try {
      const response = await DefaultService.getExpenses1(id);
      useMascotStore.getState().setExpression("success");
      return unwrap<Expense>(response);
    } catch (error) {
      useMascotStore.getState().setExpression("error");
      console.error(`Error fetching expense ${id}:`, error);
      throw new Error("Failed to fetch expense");
    }
  }

  // POST expense (multipart)
  static async createExpense(expenseData: CreateExpenseRequest) {
    const fd = new FormData();
    appendIf(fd, "amount", Number(expenseData.amount));
    appendIf(fd, "description", expenseData.description);
    appendIf(fd, "type", expenseData.type);
    appendIf(fd, "categoryId", expenseData.categoryId);
    if (expenseData.type === "one-time") {
      appendIf(fd, "date", expenseData.date);
    } else {
      appendIf(fd, "startDate", expenseData.startDate);
      appendIf(fd, "endDate", expenseData.endDate);
    }
    if (expenseData.receipt) fd.append("receipt", expenseData.receipt);

    const res = await fetch(`${API_BASE}/expenses`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    const json = await res.json();
    useMascotStore.getState().setExpression(res.ok ? "success" : "error");
    if (!res.ok) throw new Error(json?.error || "Failed to create expense");
    return unwrap<Expense>(json);
  }

  // UPDATE expense (multipart)
  static async updateExpense(id: string, expenseData: UpdateExpenseRequest) {
    const fd = new FormData();
    if (expenseData.amount !== undefined)
      appendIf(fd, "amount", Number(expenseData.amount));
    appendIf(fd, "description", expenseData.description);
    appendIf(fd, "type", expenseData.type);
    appendIf(fd, "categoryId", expenseData.categoryId);
    appendIf(fd, "date", expenseData.date);
    appendIf(fd, "startDate", expenseData.startDate);
    appendIf(fd, "endDate", expenseData.endDate);
    if (expenseData.receipt) fd.append("receipt", expenseData.receipt);

    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: "PUT",
      body: fd,
      credentials: "include",
    });
    const json = await res.json();
    useMascotStore.getState().setExpression(res.ok ? "success" : "error");
    if (!res.ok) throw new Error(json?.error || "Failed to update expense");
    return unwrap<Expense>(json);
  }

  // DELETE expense
  static async deleteExpense(id: string) {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    useMascotStore.getState().setExpression(res.ok ? "success" : "error");
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || "Failed to delete expense");
    }
  }
}
