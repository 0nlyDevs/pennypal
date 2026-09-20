import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DefaultService } from "../../api";
import { useAuth } from "../../hooks/useAuth";
import UsernameModal from "./UsernameModal";
import CategoriesOnboardingModal from "./CategoriesOnboardingModal";
import type { Category } from "../../types/Auth";
import { useToast } from "../../ui";

export default function PostAuthGate() {
  const { user, loading, updateProfile } = useAuth();
  const toast = useToast();

  const [openUsername, setOpenUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const [openCategories, setOpenCategories] = useState(false);

  const email = useMemo(() => user?.email ?? "", [user]);

  const checkNeeds = useCallback(async () => {
    if (!user) return;
    if (!user.username || user.username.trim().length === 0) {
      setUsername(user.username ?? "");
      setOpenUsername(true);
      return;
    }
    try {
      const cats = (await DefaultService.getCategories()) as Category[];
      const hasUserCats = (cats || []).some(c => c.user_id != null);
      if (!hasUserCats) setOpenCategories(true);
    } catch {
      toast.error("Failed to load categories");
    }
  }, [toast, user]);

  const checkedUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      checkedUserIdRef.current = null;
      return;
    }
    if (checkedUserIdRef.current === user.user_id) return;
    checkedUserIdRef.current = user.user_id;
    void checkNeeds();
  }, [user, loading, checkNeeds]);

  const handleSkipUsername = async () => {
    setOpenUsername(false);
    try {
      const cats = (await DefaultService.getCategories()) as Category[];
      const hasUserCats = (cats || []).some(c => c.user_id != null);
      if (!hasUserCats) setOpenCategories(true);
    } catch {
      toast.error("Failed to load categories");
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim()) return; 
    setSavingUsername(true);
    try {
      await updateProfile({ username: username.trim() });
      setOpenUsername(false);
      try {
        const cats = (await DefaultService.getCategories()) as Category[];
        const hasUserCats = (cats || []).some(c => c.user_id != null);
        if (!hasUserCats) setOpenCategories(true);
      } catch {
        toast.error("Failed to load categories");
      }
    } catch {
      toast.error("Failed to save username");
    } finally {
      setSavingUsername(false);
    }
  };

  return (
    <>
      <UsernameModal
        open={openUsername}
        email={email}
        username={username}
        onUsernameChange={setUsername}
        onClose={handleSkipUsername}
        onSkip={handleSkipUsername}
        onSave={handleSaveUsername}
        saving={savingUsername}
      />

      <CategoriesOnboardingModal
        open={openCategories}
        onClose={() => setOpenCategories(false)}
        onDone={() => setOpenCategories(false)}
      />
    </>
  );
}
