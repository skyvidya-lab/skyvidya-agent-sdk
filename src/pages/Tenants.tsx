import { AppLayout } from "@/components/layout/AppLayout";
import { TenantList } from "@/components/tenants/TenantList";

export default function Tenants() {
  return (
    <AppLayout>
      <TenantList />
    </AppLayout>
  );
}
