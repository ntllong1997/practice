import { isStaff } from "@/lib/staff";
import PinLogin from "@/components/ui/PinLogin";
import MenuManager from "@/components/features/menu/MenuManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Services" };

const ServicesPage = async () => {
  if (!(await isStaff())) return <PinLogin title="Service menu" />;
  return <MenuManager />;
};

export default ServicesPage;
