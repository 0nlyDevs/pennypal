import PageContainer from "./PageContainer";

export default function RouteFallback() {
  return (
    <PageContainer className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-light/70">Loading...</p>
      </div>
    </PageContainer>
  );
}