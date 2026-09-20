import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast, Skeleton } from "../ui";
import { IncomeService } from "../services/IncomeService";
import type { Income, UpdateIncomeRequest } from "../types/Income";
import { IncomeForm } from "../components/income";
import PageContainer from "../components/common/PageContainer";

export const EditIncome = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [income, setIncome] = useState<Income | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncome = async () => {
      if (!id) return;
      try {
        const incomeData = await IncomeService.getIncomeById(id);
        setIncome(incomeData);
      } catch {
        toast.error("Failed to load income");
        navigate("/incomes");
      } finally {
        setLoading(false);
      }
    };

    fetchIncome();
  }, [id, navigate, toast]);

  const handleSave = async (formData: UpdateIncomeRequest) => {
    if (!id) return;
    try {
      await IncomeService.updateIncome(id, formData);
      toast.success("Income updated successfully");
      navigate("/incomes");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update income";
      toast.error(message);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate("/incomes");
  };

  if (loading) {
    return (
      <PageContainer maxWidth="2xl">
        <Skeleton variant="rect" height={400} rounded="rounded-lg" />
      </PageContainer>
    );
  }

  if (!income) {
    return (
      <PageContainer maxWidth="2xl">
        <div className="text-center text-red-600">Income not found</div>
      </PageContainer>
    );
  }

  return (
    <IncomeForm
      income={income}
      onSave={handleSave}
      onCancel={handleCancel}
      open={true}
    />
  );
};
