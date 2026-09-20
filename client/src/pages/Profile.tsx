import React, { useState } from "react";
import { useUserStore } from "../stores/userStore";
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
} from "../types/UserProfile";
import {
  AppearanceTab,
  ErrorState,
  LoadingState,
  LoginPrompt,
  PasswordForm,
  ProfileForm,
  ProfileInfo,
  SecuritySettings,
} from "../components/profile";
import PageContainer from "../components/common/PageContainer";

export const Profile: React.FC = () => {
  const { user, loading, error, fetchProfile, updateProfile, changePassword } =
    useUserStore();
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const handleUpdateProfile = async (data: UpdateProfileRequest) => {
    setUpdating(true);
    const result = await updateProfile(data);
    setUpdating(false);
    return result;
  };

  const handleChangePassword = async (data: ChangePasswordRequest) => {
    setChangingPassword(true);
    const result = await changePassword(data);
    setChangingPassword(false);
    return result;
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <LoginPrompt />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchProfile} />;
  }

  return (
    <PageContainer className="h-[76dvh]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          <div className="lg:col-span-2">
            <ProfileInfo
              user={user}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          <div className="lg:col-span-4">
            <div className="transition-all duration-500 ease-in-out">
              {activeTab === "profile" && (
                <ProfileForm
                  profile={user}
                  onUpdate={handleUpdateProfile}
                  loading={updating}
                />
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <PasswordForm
                    onChangePassword={handleChangePassword}
                    loading={changingPassword}
                  />
                  <SecuritySettings />
                </div>
              )}
              {activeTab === "appearance" && <AppearanceTab />}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
