import { isStaff } from "@/lib/staff";
import PinLogin from "@/components/ui/PinLogin";
import Dashboard from "@/components/features/dashboard/Dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const DashboardPage = async () => {
  if (!(await isStaff())) return <PinLogin title="Technician dashboard" />;
  return <Dashboard />;
};

export default DashboardPage;
